import { loadModules } from '@deephaven/jsapi-nodejs';
import path from 'node:path';
import { polyfill } from './polyfillUtils.mjs';
export async function getDhe(serverUrl) {
    polyfill();
    const tmpDir = path.join(__dirname, '..', 'tmp');
    // Download jsapi `ESM` files from DH Community server.
    await loadModules({
        serverUrl,
        serverPaths: ['irisapi/irisapi.nocache.js'],
        download: true,
        storageDir: tmpDir,
        sourceModuleType: 'cjs',
        targetModuleType: 'esm',
    });
    // DHE currently exposes the jsapi via the global `iris` object.
    return iris;
}
