/**
 * Experiment with generating keys in browser. Note that this isn't actually
 * running in a browser, so hard to know for sure if it works in this context.
 * Also, seems unlikely we want to have to load private keys for signing in the
 * browser anyway. Leaving for now for reference in case that changes.
 */
import type {
  Base64Nonce,
  Base64PrivateKey,
  Base64PublicKey,
  Base64Signature,
} from '@deephaven-enterprise/auth-nodejs'
import type { EnterpriseClient } from '@deephaven-enterprise/jsapi-types'

/*
 * Base64 encoded value of 'EC:'. Used to identify that a key is an EC key when
 * passing to DH server.
 */
const EC_SENTINEL = 'RUM6' as const

export async function generateBase64KeyPair(): Promise<
  [Base64PublicKey, Base64PrivateKey]
> {
  const namedCurve = 'P-256' // Equivalent named curve in Web Crypto (secp256r1)

  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve, // Can be 'P-256', 'P-384', or 'P-521'
    },
    true, // Whether the key is extractable
    ['sign', 'verify'], // Usages of the key
  )

  // Export public key in SPKI format
  const publicKey = await window.crypto.subtle.exportKey(
    'spki',
    keyPair.publicKey,
  )

  // Export private key in PKCS8 format
  const privateKey = await window.crypto.subtle.exportKey(
    'pkcs8',
    keyPair.privateKey,
  )

  return [
    arrayBufferToBase64(publicKey) as Base64PublicKey,
    arrayBufferToBase64(privateKey) as Base64PrivateKey,
  ]
}

async function signWithPrivateKey(
  nonceBase64: Base64Nonce,
  privateKeyBase64: Base64PrivateKey,
) {
  // Convert Base64 strings to ArrayBuffer
  const nonceBytes = base64ToArrayBuffer(nonceBase64)
  const privateKeyBytes = base64ToArrayBuffer(privateKeyBase64)

  // Import the private key
  const privateKey = await window.crypto.subtle.importKey(
    'pkcs8',
    privateKeyBytes,
    {
      name: 'ECDSA',
      hash: { name: 'SHA-256' },
      namedCurve: 'P-256',
    },
    false, // Not extractable
    ['sign'], // Usages of the key
  )

  // Sign the nonce
  const signature = await window.crypto.subtle.sign(
    {
      name: 'ECDSA',
      hash: { name: 'SHA-256' },
    },
    privateKey,
    nonceBytes,
  )

  // Convert the raw signature to DER format
  const derSignature = convertECDSASignatureToDER(new Uint8Array(signature))

  // Convert the signature to Base64
  return arrayBufferToBase64(derSignature) as Base64Signature
}

// Function to convert ArrayBuffer to Base64 string
function arrayBufferToBase64(buffer: ArrayBuffer) {
  // const binary = String.fromCharCode(...new Uint8Array(buffer))
  // return window.btoa(binary)
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

// Function to convert Base64 string to ArrayBuffer
function base64ToArrayBuffer(base64: string) {
  const binaryString = atob(base64)
  const len = binaryString.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes.buffer
}

function convertECDSASignatureToDER(signature: Uint8Array): ArrayBuffer {
  const r = signature.slice(0, signature.length / 2)
  const s = signature.slice(signature.length / 2)

  const rEncoded = encodeASN1Integer(r)
  const sEncoded = encodeASN1Integer(s)

  const sequence = new Uint8Array([
    0x30,
    rEncoded.length + sEncoded.length,
    ...rEncoded,
    ...sEncoded,
  ])

  return sequence.buffer
}

function encodeASN1Integer(integer: Uint8Array): Uint8Array {
  let i = 0
  while (i < integer.length && integer[i] === 0) {
    i++
  }

  if (i === integer.length) {
    return new Uint8Array([0x02, 0x01, 0x00])
  }

  let encoded = integer.slice(i)
  if (encoded[0] & 0x80) {
    encoded = new Uint8Array([0x00, ...encoded])
  }

  return new Uint8Array([0x02, encoded.length, ...encoded])
}

/**
 * Authenticate using public / private key.
 * @param dheClient The DHE client to use.
 * @param publicKey The base64 encoded public key.
 * @param privateKey The base64 encoded private key.
 * @param username The username to authenticate as.
 * @param operateAs The optional username to operate as. Defaults to `username`.
 */
export async function authWithPrivateKey({
  dheClient,
  publicKey,
  privateKey,
  username,
  operateAs = username,
}: {
  dheClient: EnterpriseClient
  publicKey: Base64PublicKey
  privateKey: Base64PrivateKey
  username: string
  operateAs?: string
}): Promise<void> {
  try {
    const { nonce }: { nonce: Base64Nonce } =
      await dheClient.getChallengeNonce()

    const signedNonce = await signWithPrivateKey(nonce, privateKey)

    console.log(signedNonce)

    const publicKeyWithSentinel = `${EC_SENTINEL}${publicKey}`

    const authResult = await dheClient.challengeResponse(
      signedNonce,
      publicKeyWithSentinel,
      username,
      operateAs,
    )

    console.log('authResult:', authResult ?? 'ok')
  } catch (e) {
    console.error(e)
  }
}
