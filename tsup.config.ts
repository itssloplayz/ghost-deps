import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/cli.ts', 'src/analyze.ts', 'src/runtime-tracker.ts'],
  format: ['cjs'],
  dts: true,
  target: 'node20',
  external: ['chalk', 'fs', 'path'], 
})
