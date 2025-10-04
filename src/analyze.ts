import fs from 'fs/promises'
import path from 'path'
import { globby } from 'globby'
import { parse } from '@babel/parser'
import traverse, { NodePath } from '@babel/traverse'
import * as t from '@babel/types'
import chalk from 'chalk'

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

export interface AnalyzeOptions {
  patterns?: string[]
  debug?: boolean
}

export interface AnalyzeResult {
  ghosts: string[]
  phantoms: string[]
  devUsedInProd: Record<string, string[]>
}

export async function analyzeProject(root = process.cwd(), opts: AnalyzeOptions = {}): Promise<AnalyzeResult> {
  const debug = opts.debug ?? false
  const safeLog = (msg: string) => {
    if (debug) console.warn(chalk.dim(msg))
  }

  let pkg: any
  try {
    const pkgPath = path.join(root, 'package.json')
    const pkgRaw = await fs.readFile(pkgPath, 'utf8')
    pkg = JSON.parse(pkgRaw)
  } catch (err: unknown) {
    const e = err as Error
    console.error(chalk.red(`⚠️  Failed to read or parse package.json in ${root}: ${e.message}`))
    return { ghosts: [], phantoms: [], devUsedInProd: {} }
  }

  const dependencies = Object.keys(pkg.dependencies ?? {})
  const devDependencies = Object.keys(pkg.devDependencies ?? {})
  const declaredAll = new Set([...dependencies, ...devDependencies])

  let files: string[] = []
  try {
    files = await globby(opts.patterns ?? ['**/*.{js,ts,jsx,tsx,mjs,cjs}'], {
      cwd: root,
      absolute: true,
      gitignore: true,
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/bin/**', '**/coverage/**']
    })
  } catch (err: unknown) {
    const e = err as Error
    console.error(chalk.red(`⚠️  Failed to scan files with globby: ${e.message}`))
    return { ghosts: [], phantoms: [], devUsedInProd: {} }
  }

  const used = new Set<string>()
  const fileToUsed = new Map<string, Set<string>>()

  for (const file of files) {
    let content: string
    try {
      content = await fs.readFile(file, 'utf8')
    } catch (err: unknown) {
      const e = err as Error
      safeLog(`Skipping unreadable file: ${file} (${e.message})`)
      continue
    }

    let ast: t.File
    try {
      ast = parse(content, {
        sourceType: 'unambiguous',
        plugins: ['typescript', 'jsx', 'dynamicImport']
      })
    } catch (err: unknown) {
      const e = err as Error
      safeLog(`Skipping unparsable file: ${file} (${e.message})`)
      continue
    }

    const localUsed = new Set<string>()
    try {
      traverse(ast, {
        ImportDeclaration({ node }: NodePath<t.ImportDeclaration>) {
          const v = node.source?.value
          const pkgName = getPackageName(v)
          if (pkgName) {
            used.add(pkgName)
            localUsed.add(pkgName)
          }
        },
        CallExpression({ node }: NodePath<t.CallExpression>) {
          const callee = node.callee
          const arg = node.arguments?.[0]
          if (
            ((t.isIdentifier(callee) && callee.name === 'require') || t.isImport(callee)) &&
            t.isStringLiteral(arg)
          ) {
            const pkgName = getPackageName(arg.value)
            if (pkgName) {
              used.add(pkgName)
              localUsed.add(pkgName)
            }
          }
        }
      })
    } catch (err: unknown) {
      const e = err as Error
      safeLog(`Traverse error in file: ${file} (${e.message})`)
    }

    fileToUsed.set(path.relative(root, file), localUsed)
  }

  const ghosts = dependencies.filter(d => !used.has(d))
  const phantoms = [...used].filter(u => !declaredAll.has(u))

  const devUsedInProd = new Map<string, string[]>()
  for (const [file, usedSet] of fileToUsed) {
    if (isDevFile(file)) continue
    const usedDev = [...usedSet].filter(u => devDependencies.includes(u))
    if (usedDev.length) devUsedInProd.set(file, usedDev)
  }

  return {
    ghosts,
    phantoms,
    devUsedInProd: Object.fromEntries(devUsedInProd)
  }
}
