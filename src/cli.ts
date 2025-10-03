import { Command } from 'commander'
import chalk from 'chalk'
import { analyzeProject } from './analyze'

const program = new Command()
program.name('ghost-deps').description('detect declared-but-unused and used-but-undeclared dependencies')
program.option('-p, --path <path>')
program.option('--json', 'output JSON')
program.action(async () => {
  const opts = program.opts()
  const root = opts.path ?? process.cwd()
  const res = await analyzeProject(root)
  if (opts.json) {
    console.log(JSON.stringify(res, null, 2))
    return
  }
  console.log(chalk.bold('👻 Ghost dependencies (declared but unused):'))
  if (res.ghosts.length === 0) console.log(chalk.dim('none'))
  else res.ghosts.forEach(d => console.log('-', d))
  console.log()
  console.log(chalk.bold('🧟 Phantoms (used but not declared):'))
  if (res.phantoms.length === 0) console.log(chalk.dim('none'))
  else res.phantoms.forEach(p => console.log('-', p))
  console.log()
  console.log(chalk.bold('🪦 Dev deps used in production files:'))
  if (Object.keys(res.devUsedInProd).length === 0) console.log(chalk.dim('none'))
  else {
    for (const file of Object.keys(res.devUsedInProd)) {
      console.log('-', file, '→', res.devUsedInProd[file].join(', '))
    }
  }
})
program.parseAsync(process.argv)
