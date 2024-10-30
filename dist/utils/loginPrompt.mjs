/**
 * Prompt the user for information to connect to a DH server.
 */
import fs from 'node:fs';
import path from 'node:path';
import { read } from 'read';
if (typeof globalThis.__dirname === 'undefined') {
    globalThis.__dirname = import.meta.dirname;
}
const AUTO_COMPLETE_PATH = path.join(__dirname, '..', '..', 'tabAutocomplete.txt');
export async function loginPrompt() {
    const completions = getAutoComplete(AUTO_COMPLETE_PATH);
    const serverUrlRaw = await read({
        prompt: 'Enter the Deephaven server URL: ',
        completer: (input) => {
            const filtered = completions.filter((c) => c.includes(input));
            return [filtered, input];
        },
    });
    const serverUrl = new URL(serverUrlRaw);
    const username = (await read({ prompt: 'Enter your username: ' }));
    const password = await read({
        prompt: 'Enter your password: ',
        replace: '*',
        silent: true,
    });
    return {
        serverUrl,
        username,
        password,
    };
}
// Optionally provide a list of server URLs to `tab` autocompletions via serverList.txt.
function getAutoComplete(autoCompletePath) {
    if (!fs.existsSync(autoCompletePath)) {
        return [];
    }
    return String(fs.readFileSync(autoCompletePath)).split('\n');
}
