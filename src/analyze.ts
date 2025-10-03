import fs from 'fs/promises'
import path from 'path'
import { globby } from 'globby'
import { parse } from '@babel/parser'
import traverse from '@babel/traverse'

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
  return /(^|\/)(test|spec|__tests__)(\/|$)/i.test(n) || /\.test\.|\.spec\./i.test(n) || /(^|\/)scripts(\/|$)/i.test(n) || /(^|\/)\.storybook(\/|$)/i.test(n)
}

export async function analyzeProject(root = process.cwd(), opts: { patterns?: string[] } = {}) {
  const pkgPath = path.join(root, 'package.json')
  const pkgRaw = await fs.readFile(pkgPath, 'utf8')
  const pkg = JSON.parse(pkgRaw)
  const dependencies = Object.keys(pkg.dependencies ?? {})
  const devDependencies = Object.keys(pkg.devDependencies ?? {})
  const declaredAll = new Set([...dependencies, ...devDependencies])
  const patterns = opts.patterns ?? ['**/*.{js,ts,jsx,tsx,mjs,cjs}']
  const files = await globby(patterns, {
  cwd: root,
  absolute: true,
  gitignore: true,
  ignore: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/bin/**',      // ⬅ add this
    '**/coverage/**'
  ]
})

  const used = new Set<string>()
  const fileToUsed = new Map<string, Set<string>>()
  for (const file of files) {
    let content: string
    try {
      content = await fs.readFile(file, 'utf8')
    } catch {
      continue
    }
    let ast: any
    try {
      ast = parse(content, { sourceType: 'unambiguous', plugins: ['typescript', 'jsx', 'dynamicImport'] })
    } catch {
      continue
    }
    const localUsed = new Set<string>()
    traverse(ast, {
      ImportDeclaration({ node }: any) {
        const v = node.source && node.source.value
        const pkgName = getPackageName(v)
        if (pkgName) {
          used.add(pkgName)
          localUsed.add(pkgName)
        }
      },
      CallExpression({ node }: any) {
        if (node.callee && node.callee.type === 'Identifier' && node.callee.name === 'require') {
          const arg = node.arguments && node.arguments[0]
          if (arg && arg.type === 'StringLiteral') {
            const pkgName = getPackageName(arg.value)
            if (pkgName) {
              used.add(pkgName)
              localUsed.add(pkgName)
            }
          }
        }
        if (node.callee && node.callee.type === 'Import') {
          const arg = node.arguments && node.arguments[0]
          if (arg && arg.type === 'StringLiteral') {
            const pkgName = getPackageName(arg.value)
            if (pkgName) {
              used.add(pkgName)
              localUsed.add(pkgName)
            }
          }
        }
      }
    })
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
