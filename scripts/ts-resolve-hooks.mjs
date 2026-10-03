// Resolve hook so node:test can import extension-less TypeScript modules (matches the repo's import style).
import { access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (err) {
    if (err && err.code === 'ERR_MODULE_NOT_FOUND' && (specifier.startsWith('.') || specifier.startsWith('/'))) {
      for (const suffix of ['.ts', '/index.ts']) {
        try {
          const url = new URL(specifier + suffix, context.parentURL);
          await access(fileURLToPath(url));
          return nextResolve(url.href, context);
        } catch {
          /* try next suffix */
        }
      }
    }
    throw err;
  }
}
