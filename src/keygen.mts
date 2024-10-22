// Experiment with generating a key pair, uploading the public key to the server,
// and authenticating with the private key.

const { authWithPrivateKey, generateBase64KeyPair, uploadPublicKey } =
  await import('./utils/authUtils.mjs')

const { loginPrompt } = await import('./utils/connectionUtils.mjs')
const { client, credentials } = await loginPrompt()

const [publicKey, privateKey] = generateBase64KeyPair()
console.log({ publicKey, privateKey })

await uploadPublicKey(client, credentials, publicKey)

await authWithPrivateKey(client, publicKey, privateKey, credentials.username)
