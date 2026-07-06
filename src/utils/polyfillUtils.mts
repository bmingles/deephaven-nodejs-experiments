export function polyfill() {
  // These will eventually not be needed once JSAPI is updated to not rely on `window` and `self`.
  // @ts-ignore
  globalThis.self = globalThis
  // @ts-ignore
  globalThis.window = globalThis
}

export function polyfillLocation(https: boolean = false) {
  // This is needed to mimic running in a local http browser environment when
  // making requests to the server. This at least impacts websocket connections.
  // Not sure if it is needed for other requests. The url is an arbitrary
  // non-https url just to make it stand out in logs.
  // @ts-ignore
  global.window.location = new URL(
    `http${https ? 's' : ''}://deephaven-repl.localhost/`,
  )
}

/**
 * Polyfill for `Promise.withResolvers`. Available in Node 22.
 */
export function withResolvers<T>(): PromiseWithResolvers<T> {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: any) => void

  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })

  return {
    promise,
    resolve,
    reject,
  }
}
