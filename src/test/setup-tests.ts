// Bun test preload (see bunfig.toml [test].preload). Runs before any test module.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { mock } from 'bun:test'

// 1. The `server-only` npm package throws on import outside a React Server
//    Component graph (the Bun test runner sets no `react-server` export
//    condition). Our data-access modules import it as a build-time guard, so we
//    stub it to an empty module to let those modules load under `bun test`.
mock.module('server-only', () => ({}))

// 1b. The data layer uses the `use cache` directive with `cacheLife`/`cacheTag`
//     from `next/cache`. Under `bun test` the directive is not compiled (it's a
//     no-op string) and the real `cacheLife`/`cacheTag` throw outside a Next.js
//     server context, so stub them as no-ops — tests exercise the uncached path.
mock.module('next/cache', () => ({
  cacheLife: () => {},
  cacheTag: () => {},
}))

// 2. `bun test` runs with NODE_ENV=test and, following the dotenv-flow
//    convention, does NOT auto-load `.env.local`. Load it explicitly so the
//    server-only data layer can read TMDB_API_KEY during tests.
try {
  const contents = readFileSync(join(process.cwd(), '.env.local'), 'utf8')
  for (const line of contents.split('\n')) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/)
    if (!match || line.trimStart().startsWith('#')) continue
    const [, name, rawValue] = match
    if (!(name in process.env)) {
      process.env[name] = rawValue.replace(/^["']|["']$/g, '')
    }
  }
} catch {
  // No .env.local present — tests that need the key will surface a clear error.
}
