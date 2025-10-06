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
  .version('0.1.3')
  .showHelpAfterError()

program.action(async () => {
  const opts = program.opts() as CLIOptions
  const root = opts.path ?? process.cwd()
  const spinner = ora(`Analyzing ${chalk.cyan(root)}...`).start()

  try {
    const res: AnalysisResult = await analyzeProject(root)
    spinner.succeed('Analysis complete')

    const output = opts.json
      ? JSON.stringify(res, null, 2)
      : formatResults(res, opts.color ?? true)

    if (opts.output) {
      await saveOutput(opts.output, output)
    } else {
      console.log(output)
    }

    process.exit(res.ghosts.length || res.phantoms.length ? 1 : 0)
  } catch (err: any) {
    spinner.fail(chalk.red(`Error: ${err.message ?? err}`))
    process.exit(2)
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
