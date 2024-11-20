import diagnosticsChannel from 'diagnostics_channel'
import { setGlobalDispatcher, Agent, Request, Response } from 'undici'

export function enableUndiciHttp2(): void {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

  setGlobalDispatcher(
    new Agent({
      allowH2: true,
    }),
  )
}

// https://github.com/nodejs/undici/blob/main/docs/docs/api/DiagnosticsChannel.md

function logDiagnostics(
  name: string,
  parseEvent: (event: any) => unknown[],
  { isError = false }: { isError?: boolean } = {},
): void {
  diagnosticsChannel.subscribe(name, (event) => {
    const args = parseEvent(event)

    if (isError) {
      console.error(name, ...args)
    } else {
      console.log(name, ...args)
    }
  })
}

export function enableUndiciDiagnostics(): void {
  console.log('undici version:', process.versions.undici)

  logDiagnostics('undici:request:create', ({ request }) => [request])
  logDiagnostics('undici:request:bodySent', ({ request }) => [request])
  logDiagnostics(
    'undici:request:headers',
    ({ request, response }: { request: Request; response: Response }) => [
      request,
      response.statusText,
      (response.headers as unknown as Buffer[]).map(String),
    ],
  )

  logDiagnostics('undici:request:trailers', ({ request, trailers }) => [
    request,
    // trailers are buffers
    trailers.map(String),
  ])

  logDiagnostics(
    'undici:request:error',
    ({ request, error }) => [request, error],
    { isError: true },
  )

  logDiagnostics(
    'undici:client:sendHeaders',
    ({ request, headers, socket }) => [request, headers.split('\r\n'), socket],
  )

  logDiagnostics(
    'undici:client:beforeConnect',
    ({ connectParams, connector }) => [connectParams, connector],
  )

  logDiagnostics(
    'undici:client:connected',
    ({ socket, connectParams, connector }) => [
      socket,
      connectParams,
      connector,
    ],
  )

  logDiagnostics(
    'undici:client:connectError',
    ({ error, socket, connectParams, connector }) => [
      error,
      socket,
      connectParams,
      connector,
    ],
    { isError: true },
  )

  logDiagnostics(
    'undici:websocket:open',
    ({ address, protocol, extensions }) => [address, protocol, extensions],
  )

  logDiagnostics('undici:websocket:close', ({ websocket, code, reason }) => [
    websocket,
    code,
    reason,
  ])

  logDiagnostics('undici:websocket:socket_error', (error) => [error], {
    isError: true,
  })

  logDiagnostics('undici:websocket:ping', ({ payload }) => [payload])

  logDiagnostics('undici:websocket:pong', ({ payload }) => [payload])
}
