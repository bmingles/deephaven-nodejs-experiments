/**
 * Enterprise example of showing query config rows. Note that it will only show
 * rows the logged in user has access to.
 */
import Log, { LoggerLevel } from '@deephaven/log'
import type { dh as DhType } from '@deephaven/jsapi-types'
import {
  createInteractiveConsoleQuery,
  createPasswordCredentials,
  createQueryConfigViewportSubscription,
  initCorePlusManager,
} from '@deephaven-enterprise/jsapi-nodejs'
import { loginPrompt } from './utils/loginPrompt.mjs'

// Cut down on info level noise
Log.setLogLevel(LoggerLevel.WARN)

const { serverUrl, username, password } = await loginPrompt()

const credentials = createPasswordCredentials(username, password)

const corePlusManager = await initCorePlusManager({
  serverUrl,
  credentials,
})
const { dhe } = corePlusManager

const subscription = await createQueryConfigViewportSubscription({
  columnNames: ['Name', 'Status'],
  corePlusManager,
})

subscription.addEventListener<DhType.ViewportData>(
  dhe.Table.EVENT_UPDATED,
  ({ detail }) => {
    console.log('\nQuery config updated:')

    for (const row of detail.rows) {
      console.log(
        detail.columns.map((col) => `${col.name}=${row.get(col)}`).join(', '),
      )
    }
  },
)

const workerName = 'my-worker-' + crypto.randomUUID().slice(0, 8)
console.log(`Creating worker query '${workerName}'...`)

await createInteractiveConsoleQuery(corePlusManager, {
  name: workerName,
})

process.exit(0)
