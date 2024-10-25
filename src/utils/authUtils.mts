import type {
  EnterpriseClient,
  LoginCredentials as DheLoginCredentials,
} from '@deephaven-enterprise/jsapi-types'
import { generateKeyPairSync, sign } from 'node:crypto'

// Branded type helpers
declare const __brand: unique symbol
export type Brand<T extends string, TBase = string> = TBase & {
  readonly [__brand]: T
}

type Base64PrivateKey = Brand<'Base64PrivateKey', string>
type Base64PublicKey = Brand<'Base64PublicKey', string>
type Base64Nonce = Brand<'Base64Nonce', string>
type Base64Signature = Brand<'Base64Signature', string>

/*
 * Base64 encoded value of 'EC:'. Used to identify that a key is an EC key when
 * passing to DH server.
 */
export const EC_SENTINEL = 'RUM6' as const

/*
 * Named curve to use for generating key pairs.
 * Note that 'prime256v1' is synonymous with 'secp256r1'.
 */
const NAMED_CURVE = 'prime256v1' as const

/**
 * Generate a base64 encoded asymmetric key pair using eliptic curve.
 * @returns A tuple containing the base64 encoded public and private keys.
 */
export function generateBase64KeyPair(): [Base64PublicKey, Base64PrivateKey] {
  const { publicKey: publicKeyBuffer, privateKey: privateKeyBuffer } =
    generateKeyPairSync('ec', {
      namedCurve: NAMED_CURVE,
      publicKeyEncoding: { type: 'spki', format: 'der' },
      privateKeyEncoding: { type: 'pkcs8', format: 'der' },
    })

  const publicKey = publicKeyBuffer.toString('base64') as Base64PublicKey
  const privateKey = privateKeyBuffer.toString('base64') as Base64PrivateKey

  return [publicKey, privateKey]
}

/**
 * Sign a nonce using a private key.
 * @param nonce
 * @param privateKey
 * @returns The base64 encoded signature.
 */
export function signWithPrivateKey(
  nonce: Base64Nonce,
  privateKey: Base64PrivateKey,
): Base64Signature {
  const nonceBytes = Buffer.from(nonce, 'base64')
  const privateKeyBytes = Buffer.from(privateKey, 'base64')

  return sign('sha256', nonceBytes, {
    key: privateKeyBytes,
    format: 'der',
    type: 'pkcs8',
  }).toString('base64') as Base64Signature
}

/**
 * Upload public key to DHE server.
 * @param dheClient
 * @param dheCredentials
 * @param publicKey
 */
export async function uploadPublicKey(
  dheClient: EnterpriseClient,
  dheCredentials: DheLoginCredentials,
  publicKey: Base64PublicKey,
): Promise<void> {
  const { dbAclWriterHost, dbAclWriterPort } =
    await dheClient.getServerConfigValues()

  const publicKeyWithSentinel = `${EC_SENTINEL}${publicKey}`

  const body = {
    user: dheCredentials.username,
    encodedStr: publicKeyWithSentinel,
    algorithm: 'EC',
    comment: `Generated by DH repl ${new Date().toISOString()}`,
  }

  const uploadKeyResult = await fetch(
    `https://${dbAclWriterHost}:${dbAclWriterPort}/acl/publickey`,
    {
      method: 'POST',
      headers: {
        /* eslint-disable @typescript-eslint/naming-convention */
        Authorization: await dheClient.createAuthToken('DbAclWriteServer'),
        'Content-Type': 'application/json',
        /* eslint-enable @typescript-eslint/naming-convention */
      },
      body: JSON.stringify(body),
    },
  )

  console.log('uploadKeyResult:', uploadKeyResult)
}

declare module '@deephaven-enterprise/jsapi-types' {
  interface EnterpriseClient {
    challengeResponse: (
      signedNonce: Base64Signature,
      publicKeyWithSentinel: string,
      username: string,
      operateAs: string,
    ) => Promise<unknown>
    getChallengeNonce(): Promise<{ nonce: Base64Nonce }>
  }
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

    const signedNonce = signWithPrivateKey(nonce, privateKey)

    const publicKeyWithSentinel = `${EC_SENTINEL}${publicKey}`

    const authResult = await dheClient.challengeResponse(
      signedNonce,
      publicKeyWithSentinel,
      username,
      operateAs,
    )

    console.log('authResult:', authResult)
  } catch (e) {
    console.error(e)
  }
}
