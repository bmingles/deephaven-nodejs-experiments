import {
  createClient,
  deletePublicKeys,
  loginClientWithPassword,
  type AuthenticatedClient,
  type Base64PublicKey,
  type PasswordCredentials,
  type Username,
} from '@deephaven-enterprise/auth-nodejs'
import type { dh as DhType } from '@deephaven/jsapi-types'
import { loginPrompt } from './utils/loginPrompt.mjs'
import { getDhe } from './utils/dheUtils.mjs'
import type { QueryInfo } from '@deephaven-enterprise/jsapi-types'

const { serverUrl, username, password } = await loginPrompt()
const credentials: PasswordCredentials = {
  type: 'password',
  username,
  token: password,
}

const dhe = await getDhe(serverUrl)
const dheClient = await loginClientWithPassword(
  await createClient(dhe, serverUrl),
  credentials,
)

// deletePublicKeys(dheClient, username, [])
const publicKeys = await listPublicKeys(dheClient, 'VSCode')
console.log('Deleting public keys:', publicKeys)

for (const { userName, publicKey } of publicKeys) {
  await deletePublicKeys({
    dheClient,
    userName,
    publicKeys: [publicKey.replace(/^RUM6/, '')],
    type: 'ec',
  })
}

// try {
//   console.log('Refreshing ACL data.')
//   const aclSnapTable = await getWebClientDataTable(dheClient, 'aclSnapTable')
//   const aclInputTable = await aclSnapTable.inputTable()
//   await aclInputTable.addRow({ Key: 0, Dummy: 0 })
// } catch (err) {
//   console.error('Failed to refresh ACL data:', err)
//   process.exit(1)
// }

process.exit(0)

async function getWebClientDataTable(
  dheClient: AuthenticatedClient,
  tableName: string,
) {
  const webClientData: QueryInfo = await new Promise((resolve) =>
    dheClient.addEventListener(iris.Client.EVENT_CONFIG_ADDED, ({ detail }) => {
      if (detail.name === 'WebClientData') {
        resolve(detail)
      }
    }),
  )

  return webClientData.designated!.getTable(tableName)
}

async function listPublicKeys(dheClient: AuthenticatedClient, filter: string) {
  const table = await getWebClientDataTable(dheClient, 'publicKeys')

  const userColumn = table.findColumn('user')
  const keyValColumn = table.findColumn('keyval')
  const commentColumn = table.findColumn('comment')

  table.setViewport(0, table.size, null)
  const viewportData = await table.getViewportData()

  return viewportData.rows
    .map((row: DhType.Row) => ({
      userName: row.get(userColumn),
      publicKey: row.get(keyValColumn),
      comment: row.get(commentColumn),
    }))
    .filter((item) => item.comment.includes(filter))
}
