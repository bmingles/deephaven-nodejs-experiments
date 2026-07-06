import {
  createJsApiFactories,
  createPasswordCredentials,
  initCorePlusManager,
  type EnterpriseClientFactory,
  type EnterpriseDhType,
  type ConnectOptions,
  type RefreshToken,
} from '@deephaven-enterprise/jsapi-nodejs'
import { loginPrompt } from './utils/loginPrompt.mjs'
import { withResolvers } from './utils/polyfillUtils.mjs'

const { serverUrl, username, password } = await loginPrompt()

const credentials = createPasswordCredentials(username, password)

const jsApiFactories = createJsApiFactories()

const { promise: authRefreshTokenPromise, resolve } =
  withResolvers<RefreshToken>()

/**
 * Wrap jsApiFactories.createEnterpriseClient so we can get the refresh token.
 */
const createEnterpriseClient: EnterpriseClientFactory = async (
  dhe: EnterpriseDhType,
  serverUrl: URL,
  connectOptions?: ConnectOptions,
) => {
  const dheClient = await jsApiFactories.createEnterpriseClient(
    dhe,
    serverUrl,
    connectOptions,
  )

  dheClient.addEventListener(
    dhe.Client.EVENT_REFRESH_TOKEN_UPDATED,
    async ({
      detail: { bytes, expiry, authenticatedUser, effectiveUser },
    }: CustomEvent<RefreshToken>) => {
      resolve({
        bytes,
        expiry,
        authenticatedUser,
        effectiveUser,
      })
    },
  )

  return dheClient
}

const corePlusManager = await initCorePlusManager({
  serverUrl,
  credentials,
  jsApiFactories: { ...jsApiFactories, createEnterpriseClient },
})
const { dhe } = corePlusManager

const refreshToken = await authRefreshTokenPromise
console.log('Refresh token:', refreshToken)

const dheClient2 = await jsApiFactories.createEnterpriseClient(dhe, serverUrl)
await dheClient2.relogin(refreshToken)

console.log('Relogin successful with refresh token')

process.exit(0)
