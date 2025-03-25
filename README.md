# Deephaven REPL experiments

## Community Examples

Community `cjs` module

```sh
npx tsx src/community.cts
```

Community `esm` module

```sh
npx tsx src/community.mts
```

> Examples can also be run by opening the file and `f5` to run `tsx` launch config.

## Enterprise Examples

1. Repl with `dh` and `client` available on context:

```sh
npx tsx src/repl.cts
```

3. Private / public key gen + auth

```sh
npx tsx src/keygen.mts
```

> Examples can also be run by opening the file and `f5` to run `tsx` launch config.

### Auto Complete

If you want to enable auto complete of a list of DHE servers, create a `tabAutocomplete.txt` in the root of the repo containing 1 server url per line.
