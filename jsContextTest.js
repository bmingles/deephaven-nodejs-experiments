/** This file can be loaded into the repl context via .load ./jsContextText.js */
console.log('Hello from jsContextTest!')

const userInfo = await client.getUserInfo()

console.log('User info:', userInfo)
