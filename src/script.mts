const { authWithPrivateKey, generateBase64KeyPair, uploadPublicKey } =
  await import('./authUtils.mjs')

const [publicKey, privateKey] = generateBase64KeyPair()
console.log({ publicKey, privateKey })

await uploadPublicKey(client, credentials, publicKey)

await authWithPrivateKey(client, publicKey, privateKey, credentials.username)
