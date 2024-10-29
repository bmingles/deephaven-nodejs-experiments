/**
 * Prompt the user for information to connect to a DH server.
 */

import type { Username } from '@deephaven-enterprise/auth-nodejs'
import fs from 'node:fs'
import path from 'node:path'
import { read } from 'read'

if (typeof globalThis.__dirname === 'undefined') {
  globalThis.__dirname = import.meta.dirname
}

const AUTO_COMPLETE_PATH = path.join(
  __dirname,
  '..',
  '..',
  'tabAutocomplete.txt',
)

export interface ServerCredentials {
  serverUrl: URL
  username: Username
  password: string
}

export async function loginPrompt(): Promise<ServerCredentials> {
  const completions = getAutoComplete(AUTO_COMPLETE_PATH)

  const serverUrlRaw = await read({
    prompt: 'Enter the Deephaven server URL: ',
    completer: (input: string) => {
      const filtered = completions.filter((c) => c.includes(input))
      return [filtered, input]
    },
  })
  const serverUrl = new URL(serverUrlRaw)

  const username = (await read({ prompt: 'Enter your username: ' })) as Username
  const password = await read({
    prompt: 'Enter your password: ',
    replace: '*',
    silent: true,
  })

  return {
    serverUrl,
    username,
    password,
  }
}

// Optionally provide a list of server URLs to `tab` autocompletions via serverList.txt.
function getAutoComplete(autoCompletePath: string): string[] {
  if (!fs.existsSync(autoCompletePath)) {
    return []
  }

  return String(fs.readFileSync(autoCompletePath)).split('\n')
}
