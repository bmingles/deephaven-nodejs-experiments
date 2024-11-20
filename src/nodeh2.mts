import http2 from 'node:http2'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

// Start an http2 session
const session = http2.connect('https://localhost:8443/')
session.on('error', (err) => {
  console.error(err)
})

// Make a request to GetConsoleTypes endpoint
const req = session.request({
  ':method': 'POST',
  ':path':
    '/io.deephaven.proto.backplane.script.grpc.ConsoleService/GetConsoleTypes',
  'content-type': 'application/grpc-web+proto',
})
req.end()

req.on('response', (headers) => {
  console.log(headers)
})

req.setEncoding('utf8')

// Collect the response data
let data = ''
req.on('data', (chunk) => {
  data += chunk
})

// Dump data and close session
req.on('end', () => {
  console.log(data)
  session.close()
})
