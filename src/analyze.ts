import fs from 'fs/promises'
import path from 'path'
import { globby } from 'globby'
import { parse } from '@babel/parser'
import traverse, { NodePath } from '@babel/traverse'
import * as t from '@babel/types'
import chalk from 'chalk'
import pLimit from 'p-limit'
import { builtinModules } from 'module'

interface PackageJson {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

export interface AnalyzeOptions {
  patterns?: string[]
  debug?: boolean
  ignore?: string[]
  concurrency?: number
}

export interface AnalyzeResult {
  ghosts: string[]
  phantoms: string[]
  devUsedInProd: Record<string, string[]>
}

function getPackageName(p: string | null): string | null {
  if (!p) return null
  if (p.startsWith('.') || p.startsWith('/') || p.startsWith('..')) return null
  if (p.startsWith('@')) {
    const parts = p.split('/')
    return parts.length >= 2 ? parts.slice(0, 2).join('/') : p
  }
  return p.split('/')[0]
}

function isDevFile(file: string): boolean {
  const n = file.replace(/\\/g, '/')
  return (
    /(^|\/)(test|spec|__tests__)(\/|$)/i.test(n) ||
    /\.test\.|\.spec\./i.test(n) ||
    /(^|\/)scripts(\/|$)/i.test(n) ||
    /(^|\/)\.storybook(\/|$)/i.test(n)
  )
}

async function readPackage(root: string, debug: boolean): Promise<PackageJson | null> {
  try {
    const pkgPath = path.join(root, 'package.json')
    const pkgRaw = await fs.readFile(pkgPath, 'utf8')
    return JSON.parse(pkgRaw)
  } catch (err: unknown) {
    const e = err as Error
    if (debug) console.warn(chalk.red(`⚠️  Failed to read or parse package.json: ${e.message}`))
    return null
  }
}

async function getProjectFiles(root: string, patterns?: string[], debug = false): Promise<string[]> {
  try {
    return await globby(patterns ?? ['**/*.{js,ts,jsx,tsx,mjs,cjs}'], {
      cwd: root,
      absolute: true,
      gitignore: true,
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/bin/**', '**/coverage/**']
    })
  } catch (err: unknown) {
    const e = err as Error
    if (debug) console.warn(chalk.red(`⚠️  Failed to scan files with globby: ${e.message}`))
    return []
  }
}

function normalizeIgnore(ignore?: string[] | undefined): string[] {
  if (!ignore) return []
  return Array.from(new Set(ignore.map(i => i.trim()).filter(Boolean)))
}

async function analyzeFile(file: string, root: string, debug: boolean): Promise<[string, Set<string>]> {
  const used = new Set<string>()
  try {
    const stat = await fs.stat(file)
    // skip very large files to avoid OOM / long parse times (1MB)
    if (stat.size > 1_000_000) {
      if (debug) console.warn(chalk.dim(`Skipping large file ${path.relative(root, file)} (${stat.size} bytes)`))
      return [path.relative(root, file), used]
    }
    const content = await fs.readFile(file, 'utf8')
    const ast = parse(content, {
      sourceType: 'unambiguous',
      plugins: [
        'typescript',
        'jsx',
        'dynamicImport',
        'decorators-legacy',
        'importMeta'
      ]
    })

    traverse(ast, {
      ImportDeclaration({ node }: NodePath<t.ImportDeclaration>) {
        const pkgName = getPackageName(node.source?.value)
        if (pkgName) used.add(pkgName)
      },
      ExportAllDeclaration({ node }: NodePath<t.ExportAllDeclaration>) {
        const pkgName = getPackageName(node.source?.value)
        if (pkgName) used.add(pkgName)
      },
      ExportNamedDeclaration({ node }: NodePath<t.ExportNamedDeclaration>) {
        const pkgName = getPackageName(node.source?.value ?? null)
        if (pkgName) used.add(pkgName)
      },
      CallExpression({ node }: NodePath<t.CallExpression>) {
        const callee = node.callee
        const arg = node.arguments?.[0]
        if (
          ((t.isIdentifier(callee) && callee.name === 'require') || t.isImport(callee)) &&
          t.isStringLiteral(arg)
        ) {
          const pkgName = getPackageName(arg.value)
          if (pkgName) used.add(pkgName)
        }
      }
    })
  } catch (err: unknown) {
    const e = err as Error
    if (debug) console.warn(chalk.dim(`Skipping ${path.relative(root, file)} (${e.message})`))
  }
  return [path.relative(root, file), used]
}

export async function analyzeProject(root = process.cwd(), opts: AnalyzeOptions = {}): Promise<AnalyzeResult> {
  const debug = opts.debug ?? false
  let concurrency = opts.concurrency ?? 8
  // clamp concurrency between 1 and 64
  concurrency = Math.max(1, Math.min(64, concurrency))

  const ignoreList = normalizeIgnore(opts.ignore)

  const pkg = await readPackage(root, debug)
  if (!pkg) return { ghosts: [], phantoms: [], devUsedInProd: {} }

  const dependencies = Object.keys(pkg.dependencies ?? {})
  const devDependencies = Object.keys(pkg.devDependencies ?? {})
  const declaredAll = new Set([...dependencies, ...devDependencies])

  const files = await getProjectFiles(root, opts.patterns, debug)
  if (!files.length) {
    if (debug) console.log(chalk.yellow('⚠️  No source files found.'))
    return { ghosts: [], phantoms: [], devUsedInProd: {} }
  }

  if (debug) console.log(chalk.dim(`Scanning ${files.length} files...`))

  const limit = pLimit(concurrency)
  const results = await Promise.all(files.map(f => limit(() => analyzeFile(f, root, debug))))

  const used = new Set<string>()
  const fileToUsed = new Map<string, Set<string>>()
  for (const [file, localUsed] of results) {
    fileToUsed.set(file, localUsed)
    for (const u of localUsed) used.add(u)
  }

  const ghosts = dependencies.filter(d => !used.has(d))
  const builtinSet = new Set(builtinModules)
  const phantoms = [...used].filter(u => !declaredAll.has(u) && !ignoreList.includes(u) && !builtinSet.has(u))

  const devUsedInProd = new Map<string, string[]>()
  for (const [file, usedSet] of fileToUsed) {
    if (isDevFile(file)) continue
    const usedDev = [...usedSet].filter(u => devDependencies.includes(u))
    if (usedDev.length) devUsedInProd.set(file, usedDev)
  }

  if (debug) {
    console.log(chalk.green(`✔ Found ${used.size} unique imports across ${files.length} files.`))
    if (ghosts.length) console.log(chalk.yellow(`👻 Unused deps: ${ghosts.join(', ')}`))
    if (phantoms.length) console.log(chalk.magenta(`🕯 Undeclared deps: ${phantoms.join(', ')}`))
  }

  return {
    ghosts,
    phantoms,
    devUsedInProd: Object.fromEntries(devUsedInProd)
  }
}
