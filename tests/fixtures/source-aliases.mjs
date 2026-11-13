// Native Node tests can load server-only TS services without bundling the app.
import { registerHooks } from 'node:module';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

registerHooks({ resolve(specifier, context, nextResolve) {
 if (specifier.startsWith('@/')) {
  const base = new URL(`../../src/${specifier.slice(2)}`, import.meta.url);
  for (const suffix of ['', '.ts', '.tsx']) {
   const candidate = new URL(base.href + suffix);
   if (existsSync(fileURLToPath(candidate))) return nextResolve(candidate.href, context);
  }
 }
 return nextResolve(specifier, context);
} });
