import { getDhc } from './utils/dhcUtils.mjs'

if (typeof globalThis.__dirname === 'undefined') {
  globalThis.__dirname = import.meta.dirname
}

async function main() {
  const serverUrl = new URL('http://localhost:10000/')

  const dhc = await getDhc(serverUrl, 'cjs')

  const client = new dhc.CoreClient(serverUrl.href)

  await client.login({
    type: dhc.CoreClient.LOGIN_TYPE_ANONYMOUS,
  })

  const cn = await client.getAsIdeConnection()

  await cn.getConsoleTypes()

  const session = await cn.startSession('python')

  // await session.runCode('print("Hello, World!")')
  try {
    await session.runCode(
      'from deephaven import time_table\n\nsimple_ticking = time_table("PT2S")\n\nsimple_ticking2 = time_table("PT2S")\n\nsimple_ticking3 = time_table("PT2S")',
    )
    console.log('Success')
  } catch (e) {
    console.log(e)
  }

  process.exit(0)
}

main()
