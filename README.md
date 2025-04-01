# Deephaven JS API in NodeJS

Examples of consuming [Deephaven](https://deephaven.io/) JS API from NodeJS.

## Community Examples

Examples of consuming JS API from a Deephaven Community server.

> The examples assume you are running a Deephaven Community server at http://localhost:1000.

### CommonJS Example

Run the script: [src/community.cts](src/community.cts)

```sh
npx tsx src/community.cts
```

### ES Module Example

Run the script: [src/community.mts](src/community.mts)

```sh
npx tsx src/community.mts
```

> Examples can also be run by opening the file and `f5` to run `tsx` launch config.

## Enterprise Examples

1. Repl with `dh` and `client` available on context:

   ```sh
   npx tsx src/repl.cts
   ```

1. Private / public key gen + auth

   ```sh
   npx tsx src/keygen.mts
   ```

> Examples can also be run by opening the file and `f5` to run `tsx` launch config.

### Auto Complete

If you want to enable auto complete of a list of DHE servers, create a `tabAutocomplete.txt` in the root of the repo containing 1 server url per line.
