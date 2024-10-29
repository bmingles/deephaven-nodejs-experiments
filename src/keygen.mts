// Experiment with generating a key pair, uploading the public key to the server,
// and authenticating with the private key.
import {
  generateBase64KeyPair,
  loginClientWithKeyPair,
  uploadPublicKey,
  type KeyPairCredentials,
  type PasswordCredentials,
} from '@deephaven-enterprise/auth-nodejs'
// import {
//   authWithPrivateKey,
//   generateBase64KeyPair,
// } from './utils/authUtilsBrowser.mjs'
import { loginPrompt } from './utils/loginPrompt.mjs'
import { createDheClient, getDhe } from './utils/dheUtils.mjs'

const { serverUrl, username, password } = await loginPrompt()
const credentials: PasswordCredentials = {
  type: 'password',
  username,
  token: password,
}

const dhe = await getDhe(serverUrl)
const dheClient = await createDheClient(dhe, serverUrl)

const { publicKey, privateKey } = await generateBase64KeyPair()
console.log({ publicKey, privateKey })

await uploadPublicKey(dheClient, credentials, publicKey, 'ec')

const keyPairCredentials: KeyPairCredentials = {
  type: 'keyPair',
  username: credentials.username,
  keyPair: {
    type: 'ec',
    publicKey,
    privateKey,
  },
}

await loginClientWithKeyPair(
  await createDheClient(dhe, serverUrl),
  keyPairCredentials,
)

process.exit(0)
