/**
 * Utils to help download jsapi + create an authenticated client.
 */

import type {
  EnterpriseDhType as DheType,
  EnterpriseClient,
  LoginCredentials as DheLoginCredentials,
} from '@deephaven-enterprise/jsapi-types'
import { loadModules } from '@deephaven/jsapi-nodejs'
import fs from 'node:fs'
import path from 'node:path'
import { read } from 'read'

declare global {
  // This gets added by the DHE jsapi.
  const iris: DheType
}

if (typeof globalThis.__dirname === 'undefined') {
  globalThis.__dirname = import.meta.dirname
}

const AUTO_COMPLETE_PATH = path.join(
  __dirname,
  '..',
  '..',
  'tabAutocomplete.txt',
)

export async function loginPrompt() {
  const completions = getAutoComplete(AUTO_COMPLETE_PATH)

  const serverUrlRaw = await read({
    prompt: 'Enter the DHE server URL: ',
    completer: (input: string) => {
      const filtered = completions.filter((c) => c.includes(input))
      return [filtered, input]
    },
  })
  const serverUrl = new URL(serverUrlRaw)

  const username = await read({ prompt: 'Enter your username: ' })
  const password = await read({
    prompt: 'Enter your password: ',
    replace: '*',
    silent: true,
  })
  const credentials: DheLoginCredentials = {
    type: 'password',
    username,
    token: password,
  }

  const dhe = await getDhe(serverUrl)
  const client = await createDheClient(dhe, serverUrl)
  await client.login(credentials)

  return {
    dhe,
    client,
    credentials,
  }
}

// Optionally provide a list of server URLs to `tab` autocompletions via serverList.txt.
function getAutoComplete(autoCompletePath: string): string[] {
  if (!fs.existsSync(autoCompletePath)) {
    return []
  }

  return String(fs.readFileSync(autoCompletePath)).split('\n')
}

async function getDhe(serverUrl: URL): Promise<DheType> {
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

async function createDheClient(
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

function polyfill() {
  // These will eventually not be needed once JSAPI is updated to not rely on `window` and `self`.
  // @ts-ignore
  globalThis.self = globalThis
  // @ts-ignore
  globalThis.window = globalThis

  // This is needed to mimic running in a local http browser environment when
  // making requests to the server. This at least impacts websocket connections.
  // Not sure if it is needed for other requests. The url is an arbitrary
  // non-https url just to make it stand out in logs.
  // @ts-ignore
  global.window.location = new URL('http://deephaven-repl.localhost/')
}
