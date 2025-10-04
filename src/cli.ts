import { Command } from 'commander'
import chalk from 'chalk'
import fs from 'fs'
import path from 'path'
import { analyzeProject } from './analyze'

const program = new Command()
program
  .name('ghost-deps')
  .description('detect declared-but-unused and used-but-undeclared dependencies')
  .option('-p, --path <path>', 'path to project directory')
  .option('--json', 'output JSON')
  .option('-o, --output <file>', 'save output to a file')

program.action(async () => {
  const opts = program.opts()
  const root = opts.path ?? process.cwd()
  const res = await analyzeProject(root)
  const isJson = opts.json
  const outputFile = opts.output ? path.resolve(opts.output) : null

  let output = ''
  if (isJson) {
    output = JSON.stringify(res, null, 2)
  } else {
    const lines = []
    lines.push(chalk.bold('👻 Ghost dependencies (declared but unused):'))
    if (res.ghosts.length === 0) lines.push(chalk.dim('none'))
    else res.ghosts.forEach(d => lines.push('-', d))
    lines.push('')
    lines.push(chalk.bold('🧟 Phantoms (used but not declared):'))
    if (res.phantoms.length === 0) lines.push(chalk.dim('none'))
    else res.phantoms.forEach(p => lines.push('-', p))
    lines.push('')
    lines.push(chalk.bold('🪦 Dev deps used in production files:'))
    if (Object.keys(res.devUsedInProd).length === 0) lines.push(chalk.dim('none'))
    else {
      for (const file of Object.keys(res.devUsedInProd)) {
        lines.push('-', file, '→', res.devUsedInProd[file].join(', '))
      }
    }
    output = lines.join('\n')
  }

  if (outputFile) {
    try {
      fs.writeFileSync(outputFile, output.replace(/\x1b\[[0-9;]*m/g, ''), 'utf-8')
    } catch {
      console.error(chalk.red(`Failed to write to file: ${outputFile}`))
      return
    }
    
    console.log(chalk.green(`✅ Output saved to ${outputFile}`))
  } else {
    console.log(output)
  }
})

program.parseAsync(process.argv)
