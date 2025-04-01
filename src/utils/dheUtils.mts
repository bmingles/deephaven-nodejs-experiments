import type {
  EnterpriseDhType as DheType,
  EnterpriseClient,
  LoginCredentials as DheLoginCredentials,
} from '@deephaven-enterprise/jsapi-types'
import { loadModules } from '@deephaven/jsapi-nodejs'
import path from 'node:path'
import { polyfill, polyfillLocation } from './polyfillUtils.mjs'
import type { UnauthenticatedClient } from '@deephaven-enterprise/auth-nodejs'

declare global {
  // This gets added by the DHE jsapi.
  const iris: DheType
}

export async function getDhe(serverUrl: URL): Promise<DheType> {
  polyfill()
  polyfillLocation()

  const tmpDir = path.join(__dirname, '..', 'tmp')

  // Download jsapi `ESM` files from DHE server.
  await loadModules({
    serverUrl,
    serverPaths: ['irisapi/irisapi.nocache.js'],
    download: true,
    storageDir: tmpDir,
    targetModuleType: 'esm',
  })

  // DHE currently exposes the jsapi via the global `iris` object.
  return iris
}
