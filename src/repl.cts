/**
 * REPL with DHE jsapi + client in context.
 */

import repl from 'node:repl'
import { loginPrompt } from './utils/loginPrompt.mjs'
import {
  createClient,
  loginClientWithPassword,
  type PasswordCredentials,
} from '@deephaven-enterprise/auth-nodejs'
import { getDhe } from './utils/dheUtils.mjs'

startRepl()

// declare global {
//   // These get added as readonly to the repl context.
//   const dh: DheType
//   const client: EnterpriseClient
//   const credentials: DheLoginCredentials
// }

async function startRepl() {
  const { serverUrl, username, password } = await loginPrompt()

  const credentials: PasswordCredentials = {
    type: 'password',
    username,
    token: password,
  }

  const dhe = await getDhe(serverUrl)
  const dheClient = await createClient(dhe, serverUrl)

  await loginClientWithPassword(dheClient, credentials)

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
    value: dheClient,
  })

  // TODO: This could be easily exposed via intellisense if user isn't careful.
  // Need to figure out a better way.
  Object.defineProperty(r.context, 'credentials', {
    configurable: false,
    enumerable: true,
    value: credentials,
  })

  // Load test.js into the repl context.
  r.write('.load ./jsContextTest.js\n')
}
