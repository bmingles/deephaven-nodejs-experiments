import path from 'node:path'
import { loadModules } from '@deephaven/jsapi-nodejs'
import type { dh as DhType } from '@deephaven/jsapi-types'
import { polyfill } from './polyfillUtils.mjs'

export async function getDhc(serverUrl: URL): Promise<typeof DhType> {
  polyfill(true)

  const storageDir = path.join(__dirname, '..', 'tmp')

  // Download jsapi `ESM` files from DH Community server.
  const coreModule = await loadModules<{ default: typeof DhType }>({
    serverUrl,
    serverPaths: ['jsapi/dh-core.js', 'jsapi/dh-internal.js'],
    download: true,
    storageDir,
    sourceModuleType: 'esm',
    targetModuleType: 'cjs',
    esbuildOptions: {
      tsconfigRaw: {
        compilerOptions: {
          // This needs to be set to avoid adding `use strict` to the output
          // which hits a protobuf bug. https://github.com/protocolbuffers/protobuf-javascript/issues/8
          strict: false,
        },
      },
    },
  })

  return coreModule.default
}
