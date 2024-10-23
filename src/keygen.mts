// Experiment with generating a key pair, uploading the public key to the server,
// and authenticating with the private key.

import {
  authWithPrivateKey,
  generateBase64KeyPair,
  uploadPublicKey,
} from './utils/authUtils.mjs'
import { loginPrompt } from './utils/loginPrompt.mjs'
import { connectToDheServer, dheCredentials } from './utils/dheUtils.mjs'

const { serverUrl, username, password } = await loginPrompt()
const credentials = dheCredentials({ username, password })

const { client: dheClient } = await connectToDheServer(serverUrl, credentials)

const [publicKey, privateKey] = generateBase64KeyPair()
console.log({ publicKey, privateKey })

await uploadPublicKey(dheClient, credentials, publicKey)

await authWithPrivateKey({
  dheClient,
  publicKey,
  privateKey,
  username: credentials.username,
})
