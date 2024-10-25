// Experiment with generating a key pair, uploading the public key to the server,
// and authenticating with the private key.

import {
  authWithPrivateKey,
  generateBase64KeyPair,
  uploadPublicKey,
} from './utils/authUtils.mjs'
import { loginPrompt } from './utils/loginPrompt.mjs'
import {
  connectToDheServer,
  createDheClient,
  dheCredentials,
} from './utils/dheUtils.mjs'

const { serverUrl, username, password } = await loginPrompt()
const credentials = dheCredentials({ username, password })

const { dhe, client: dheClient } = await connectToDheServer(
  serverUrl,
  credentials,
)

const [publicKey, privateKey] = generateBase64KeyPair()
console.log({ publicKey, privateKey })

await uploadPublicKey(dheClient, credentials, publicKey)

await authWithPrivateKey({
  // Have to use a client that hasn't already logged in
  dheClient: await createDheClient(dhe, serverUrl),
  publicKey,
  privateKey,
  username: credentials.username,
})

process.exit(0)
