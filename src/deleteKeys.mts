import type { EnterpriseClient } from '@deephaven-enterprise/jsapi-types'
import { connectToDheServer, dheCredentials } from './utils/dheUtils.mjs'
import { loginPrompt } from './utils/loginPrompt.mjs'

const { serverUrl, username, password } = await loginPrompt()
const credentials = dheCredentials({ username, password })

const { client: dheClient } = await connectToDheServer(serverUrl, credentials)

deletePublicKeys(dheClient, username, [''])

async function deletePublicKeys(
  dheClient: EnterpriseClient,
  userName: string,
  publicKeys: string[],
) {
  for (const toDelete of publicKeys) {
    // if (!toDelete.startsWith('RUM6')) {
    //   toDelete = `RUM6${toDelete}`
    // }

    const { dbAclWriterHost, dbAclWriterPort } =
      await dheClient.getServerConfigValues()

    const x = await fetch(
      `https://${dbAclWriterHost}:${dbAclWriterPort}/acl/publickey/${encodeURIComponent(
        userName,
      )}?${encodeURIComponent('encodedStr')}=${encodeURIComponent(
        toDelete,
      )}&${encodeURIComponent('algorithm')}=${encodeURIComponent('EC')}`,
      {
        method: 'DELETE',
        headers: {
          /* eslint-disable @typescript-eslint/naming-convention */
          Authorization: await dheClient.createAuthToken('DbAclWriteServer'),
          /* eslint-enable @typescript-eslint/naming-convention */
        },
      },
    )

    console.log(x.status)
  }

  process.exit(0)
}
