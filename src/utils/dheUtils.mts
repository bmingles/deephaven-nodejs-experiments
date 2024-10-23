import type {
  EnterpriseDhType as DheType,
  EnterpriseClient,
  LoginCredentials as DheLoginCredentials,
} from '@deephaven-enterprise/jsapi-types'
import { loadModules } from '@deephaven/jsapi-nodejs'
import path from 'node:path'
import { polyfill } from './polyfillUtils.mjs'

declare global {
  // This gets added by the DHE jsapi.
  const iris: DheType
}

export async function connectToDheServer(
  serverUrl: URL,
  credentials: DheLoginCredentials,
): Promise<{ dhe: DheType; client: EnterpriseClient }> {
  const dhe = await getDhe(serverUrl)
  const client = await createDheClient(dhe, serverUrl)

  await client.login(credentials)

  return { dhe, client }
}

export function dheCredentials({
  username,
  password: token,
}: {
  username: string
  password: string
}): DheLoginCredentials & { username: string } {
  return {
    type: 'password',
    username,
    token,
  }
}

export async function getDhe(serverUrl: URL): Promise<DheType> {
  polyfill()

  const tmpDir = path.join(__dirname, '..', 'tmp')

  // Download jsapi `ESM` files from DH Community server.
  await loadModules({
    serverUrl,
    serverPaths: ['irisapi/irisapi.nocache.js'],
    download: true,
    storageDir: tmpDir,
    sourceModuleType: 'cjs',
    targetModuleType: 'esm',
  })

  // DHE currently exposes the jsapi via the global `iris` object.
  return iris
}

export async function createDheClient(
  dhe: DheType,
  serverUrl: URL,
): Promise<EnterpriseClient> {
  const dheClient = new dhe.Client(getWsUrl(serverUrl).toString())

  return new Promise((resolve) => {
    const unsubscribe = dheClient.addEventListener(
      dhe.Client.EVENT_CONNECT,
      () => {
        unsubscribe()
        resolve(dheClient)
      },
    )
  })
}

/**
 * Get the WebSocket URL for a DHE server URL.
 * @param serverUrl The DHE server URL.
 * @returns The WebSocket URL.
 */
export function getWsUrl(serverUrl: URL): URL {
  const url = new URL('/socket', serverUrl)
  if (url.protocol === 'http:') {
    url.protocol = 'ws:'
  } else {
    url.protocol = 'wss:'
  }
  return url
}
