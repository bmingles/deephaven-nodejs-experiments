export function polyfill() {
  // These will eventually not be needed once JSAPI is updated to not rely on `window` and `self`.
  // @ts-ignore
  globalThis.self = globalThis
  // @ts-ignore
  globalThis.window = globalThis

  // This is needed to mimic running in a local http browser environment when
  // making requests to the server. This at least impacts websocket connections.
  // Not sure if it is needed for other requests. The url is an arbitrary
  // non-https url just to make it stand out in logs.
  // @ts-ignore
  global.window.location = new URL('http://deephaven-repl.localhost/')
}
