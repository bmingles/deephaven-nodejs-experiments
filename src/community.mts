import { getDhc } from './utils/dhcUtils.mjs'

console.log('Node.js version:', process.version)

if (typeof globalThis.__dirname === 'undefined') {
  globalThis.__dirname = import.meta.dirname
}

const serverUrl = new URL('http://localhost:10000/')

const dhc = await getDhc(serverUrl, 'esm')

const client = new dhc.CoreClient(serverUrl.href)

await client.login({
  type: dhc.CoreClient.LOGIN_TYPE_ANONYMOUS,
})

const cn = await client.getAsIdeConnection()

await cn.getConsoleTypes()

const session = await cn.startSession('python')

try {
  await session.runCode(
    'from deephaven import time_table\n\nsimple_ticking = time_table("PT2S")\n\nsimple_ticking2 = time_table("PT2S")\n\nsimple_ticking3 = time_table("PT2S")',
  )
  console.log('Success')
} catch (e) {
  console.log(e)
}

process.exit(0)
