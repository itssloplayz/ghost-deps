#!/usr/bin/env node
import { Command } from 'commander'
import chalk from 'chalk'
import fs from 'fs'
import path from 'path'
import ora from 'ora'
import { analyzeProject } from './analyze'

interface AnalysisResult {
  ghosts: string[]
  phantoms: string[]
  devUsedInProd: Record<string, string[]>
}

interface CLIOptions {
  path?: string
  json?: boolean
  output?: string
  color?: boolean
}

const program = new Command()
  .name('ghost-deps')
  .description('Detect declared-but-unused and used-but-undeclared dependencies')
  .option('-p, --path <path>', 'Path to project directory')
  .option('--json', 'Output as JSON')
  .option('-o, --output <file>', 'Save output to a file')
  .option('--no-color', 'Disable color output')
  .version('0.1.4')
  .showHelpAfterError()

program.action(async () => {
  const opts = program.opts() as CLIOptions
  const root = opts.path ? path.resolve(opts.path) : process.cwd()
  const useColor = opts.color ?? true
  const spinner = ora({ text: `Analyzing ${chalk.cyan(root)}...`, color: 'cyan' }).start()

  // global safety handlers (best-effort, not overriding consumer handlers)
  process.on('unhandledRejection', (reason: unknown) => {
    // eslint-disable-next-line no-console
    console.error(chalk.red(`Unhandled Rejection: ${String(reason)}`))
    process.exit(2)
  })
  process.on('uncaughtException', (err: Error) => {
    // eslint-disable-next-line no-console
    console.error(chalk.red(`Uncaught Exception: ${err.message}`))
    process.exit(2)
  })

  try {
    // validate root exists and is a directory
    let stat
    try {
      stat = await fs.promises.stat(root)
    } catch (err) {
      throw new Error(`Path does not exist: ${root}`)
    }
    if (!stat.isDirectory()) throw new Error(`Path is not a directory: ${root}`)

    const raw = await analyzeProject(root)

    // defensive normalization of result
    const res: AnalysisResult = {
      ghosts: Array.isArray((raw as any)?.ghosts) ? (raw as any).ghosts : [],
      phantoms: Array.isArray((raw as any)?.phantoms) ? (raw as any).phantoms : [],
      devUsedInProd: typeof (raw as any)?.devUsedInProd === 'object' && (raw as any).devUsedInProd !== null
        ? (raw as any).devUsedInProd
        : {},
    }

    spinner.succeed('Analysis complete')

    const output = opts.json
      ? JSON.stringify(res, null, 2)
      : formatResults(res, useColor)

    if (opts.output) {
      try {
        await saveOutput(opts.output, output)
      } catch (err: any) {
        // write failure is non-fatal for analysis but report and exit 2
        // eslint-disable-next-line no-console
        console.error(chalk.red(`Failed to save output: ${err.message ?? err}`))
        process.exit(2)
      }
    } else {
      console.log(output)
    }

    // exit with non-zero if issues were found
    process.exit(res.ghosts.length || res.phantoms.length ? 1 : 0)
  } catch (err: any) {
    // ensure spinner is cleaned up
    try { spinner.fail(chalk.red(`Error: ${err.message ?? err}`)) } catch (_) { /* ignore */ }
    process.exit(2)
  } finally {
    // ensure spinner stopped in every case
    try { spinner.stop() } catch (_) { /* ignore */ }
  }
})

program.parseAsync()

function formatResults(res: AnalysisResult, useColor: boolean): string {
  const c = (text: string, color: keyof typeof chalk) =>
  useColor ? (chalk[color] as unknown as (s: string) => string)(text) : text

  const lines: string[] = []

  lines.push(c(`👻 Ghost dependencies (${res.ghosts.length}):`, 'bold'))
  lines.push(res.ghosts.length ? res.ghosts.map(d => `- ${d}`).join('\n') : c('none', 'dim'))
  lines.push('')
  lines.push(c(`🧟 Phantoms (${res.phantoms.length}):`, 'bold'))
  lines.push(res.phantoms.length ? res.phantoms.map(p => `- ${p}`).join('\n') : c('none', 'dim'))
  lines.push('')
  lines.push(c(`🪦 Dev deps used in production files:`, 'bold'))
  if (Object.keys(res.devUsedInProd).length === 0) {
    lines.push(c('none', 'dim'))
  } else {
    for (const [file, deps] of Object.entries(res.devUsedInProd)) {
      lines.push(`- ${file} → ${deps.join(', ')}`)
    }
  }

  return lines.join('\n')
}

async function saveOutput(file: string, content: string): Promise<void> {
  const outputPath = path.resolve(file)
  const plain = content.replace(/\x1b\[[0-9;]*m/g, '') // strip ANSI colors

  await fs.promises.writeFile(outputPath, plain, 'utf-8')
  console.log(chalk.green(`✅ Output saved to ${outputPath}`))
}
