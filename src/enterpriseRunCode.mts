import {
  createInteractiveConsoleQuery,
  createPasswordCredentials,
  initCorePlusManager,
} from '@deephaven-enterprise/jsapi-nodejs'
import { loginPrompt } from './utils/loginPrompt.mjs'

const { serverUrl, username, password } = await loginPrompt()

const corePlusManager = await initCorePlusManager({
  serverUrl,
  credentials: createPasswordCredentials(username, password),
})

// Create a worker query
console.log('Creating worker query...')
const { cn, query } = await createInteractiveConsoleQuery(corePlusManager, {
  name: 'my-worker-' + crypto.randomUUID().slice(0, 8),
})
console.log(
  'Created worker query:',
  query.name,
  query.serial,
  query.designated?.grpcUrl,
)

// Start a session and run some code to create a table
const session = await cn.startSession('python')
const { changes } = await session.runCode(
  'from deephaven import time_table\nsimple_ticking = time_table("PT1S")',
)
console.log('Created table:', changes.created[0].name)

process.exit(0)
