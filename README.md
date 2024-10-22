# Deephaven REPL experiments

## Auto Complete

If you want to enable auto complete of a list of DHE servers, create a `tabAutocomplete.txt` in the root of the repo containing 1 server url per line.

## Running Examples

1. Repl with `dh` and `client` available on context:

```sh
npx tsx src/repl.cts
```

2. Private / public key gen + auth

```sh
npx tsx src/keygen.mts
```
