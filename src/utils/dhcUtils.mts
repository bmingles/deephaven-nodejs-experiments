import path from 'node:path'
import { loadModules } from '@deephaven/jsapi-nodejs'
import type { dh as DhType } from '@deephaven/jsapi-types'
import { polyfill } from './polyfillUtils.mjs'

export async function getDhc(
  serverUrl: URL,
  targetModuleType: 'cjs' | 'esm',
): Promise<typeof DhType> {
  if (targetModuleType === 'esm') {
    polyfill()
  }

  const storageDir = path.join(__dirname, '..', 'tmp')

  // Download jsapi `ESM` files from DH Community server.
  const coreModule = await loadModules<
    typeof DhType & { default?: typeof DhType }
  >({
    serverUrl,
    serverPaths: ['jsapi/dh-core.js', 'jsapi/dh-internal.js'],
    download:
      targetModuleType === 'esm'
        ? true
        : (serverPath, content) => {
            if (serverPath === 'jsapi/dh-core.js') {
              return content
                .replace(
                  `import {dhinternal} from './dh-internal.js';`,
                  `const {dhinternal} = require("./dh-internal.js");`,
                )
                .replace(`export default dh;`, `module.exports = dh;`)
            }

            if (serverPath === 'jsapi/dh-internal.js') {
              return content.replace(
                `export{__webpack_exports__dhinternal as dhinternal};`,
                `module.exports={dhinternal:__webpack_exports__dhinternal};`,
              )
            }

            return content
          },
    storageDir,
    targetModuleType,
  })

  // ESM uses `default` export. CJS does not.
  return coreModule.default ?? coreModule
}
