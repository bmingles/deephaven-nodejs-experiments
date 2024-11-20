import {
  enableUndiciDiagnostics,
  enableUndiciHttp2,
} from './utils/http2Utils.mjs'

enableUndiciHttp2()
enableUndiciDiagnostics()

const response = await fetch(
  'https://localhost:8443/io.deephaven.proto.backplane.script.grpc.ConsoleService/GetConsoleTypes',
  {
    method: 'POST',
  },
)

console.log(response)
