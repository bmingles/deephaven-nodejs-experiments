import fs from 'node:fs'
import path from 'node:path'
import repl from 'node:repl'
import { read } from 'read'
import { loadModules } from '@deephaven/jsapi-nodejs'
import type {
  EnterpriseDhType as DheType,
  EnterpriseClient,
  LoginCredentials as DheLoginCredentials,
} from '@deephaven-enterprise/jsapi-types'

main()

// Optionally provide a list of server URLs to `tab` autocompletions via serverList.txt.
let completions: string[] = []
try {
  completions = String(fs.readFileSync('./tabAutocomplete.txt')).split('\n')
} catch {}

async function main() {
  const serverUrlRaw = await read({
    prompt: 'Enter the DHE server URL: ',
    completer: (input: string) => {
      const filtered = completions.filter((c) => c.includes(input))
      return [filtered, input]
    },
  })
  const username = await read({ prompt: 'Enter your username: ' })
  const token = await read({
    prompt: 'Enter your password: ',
    replace: '*',
    silent: true,
  })

  const serverUrl = new URL(serverUrlRaw)

  startRepl(serverUrl, { type: 'password', username, token })
}

async function startRepl(serverUrl: URL, credentials: DheLoginCredentials) {
  const dhe = await getDhe(serverUrl)
  const client = await createDheClient(dhe, serverUrl)

  await client.login(credentials)

  const r = repl.start({
    prompt: 'DH > ',
  })

  // Define as read-only so that users can't accidentally overwrite it.
  Object.defineProperty(r.context, 'dh', {
    configurable: false,
    enumerable: true,
    value: dhe,
  })

  Object.defineProperty(r.context, 'client', {
    configurable: false,
    enumerable: true,
    value: client,
  })

  // TODO: This could be easily exposed via intellisense if user isn't careful.
  // Need to figure out a better way.
  Object.defineProperty(r.context, 'credentials', {
    configurable: false,
    enumerable: true,
    value: credentials,
  })
}

/** Util functions */

declare global {
  // This gets added by the DHE jsapi.
  const iris: DheType

  // These get added as readonly to the repl context.
  const dh: DheType
  const client: EnterpriseClient
  const credentials: DheLoginCredentials
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
