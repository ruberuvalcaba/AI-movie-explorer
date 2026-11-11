import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Optional real-browser regression test, using Chrome's built-in DevTools protocol.
export async function testCollectionBrowser(base, cookie, expectedIds) {
 const profile = await mkdtemp(join(tmpdir(), 'movie-collections-chrome-'));
 const chrome = spawn(process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank',
 ], { stdio: 'ignore' });
 let socket;
 let evaluate;
 try {
  let port;
  for (let attempt = 0; attempt < 100; attempt++) {
   try { port = Number((await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]); break; }
   catch { await new Promise(resolve => setTimeout(resolve, 100)); }
  }
  assert.ok(port, 'Chrome starts');
  const page = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
  socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  let id = 0;
  const pending = new Map();
  socket.addEventListener('message', ({ data }) => {
   const message = JSON.parse(data);
   const task = pending.get(message.id);
   if (!task) return;
   pending.delete(message.id);
   message.error ? task.reject(new Error(JSON.stringify(message.error))) : task.resolve(message.result);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
   const next = ++id; pending.set(next, { resolve, reject });
   socket.send(JSON.stringify({ id: next, method, params }));
  });
  evaluate = async expression => {
   const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
   if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
   return result.result.value;
  };
  const waitFor = async expression => {
   for (let attempt = 0; attempt < 150; attempt++) {
    if (await evaluate(expression)) return;
    await new Promise(resolve => setTimeout(resolve, 100));
   }
   throw new Error(`Browser condition timed out: ${expression}`);
  };
  await send('Network.enable');
  await send('Network.setBlockedURLs', { urls: ['https://*'] });
  for (const part of cookie.split('; ')) {
   const split = part.indexOf('=');
   await send('Network.setCookie', { name: part.slice(0, split), value: part.slice(split + 1), url: base, secure: false });
  }
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await send('Page.navigate', { url: `${base}/watchlist` });
  const cards = `document.querySelectorAll('main a[href^="/movie/"]')`;
  await waitFor(`${cards}.length === 24`);
  assert.equal(await evaluate(`${cards}.length`), 24, 'First load mounts 24 cards');
  assert.deepEqual(await evaluate(`[...${cards}].map(a => Number(a.getAttribute('href').split('/').at(-1)))`), expectedIds.slice(0,24), 'Only the first 24 saved movies are rendered initially');
  const more = `[...document.querySelectorAll('main button')].find(b => b.textContent === 'Load more movies')`;
  await evaluate(`(${more}).click()`);
  await waitFor(`${cards}.length === 48`);
  await evaluate(`window.scrollTo(0, document.body.scrollHeight); (${more}).click()`);
  await waitFor(`document.querySelector('main').textContent.includes('Showing 72')`);
  await waitFor(`${cards}.length === 72`);
  await evaluate('window.scrollTo(0, 0)');
  await waitFor(`!!document.querySelector('a[href="/movie/${expectedIds[0]}"]')`);
  // Cards keep the same spacing after loading additional pages.
  assert.equal(await evaluate(`(() => {
   const boxes = [...${cards}].map(a => a.getBoundingClientRect()).sort((a,b) => a.top-b.top || a.left-b.left);
   return boxes.length >= 6 && boxes[3].top >= boxes[0].bottom + 7;
  })()`), true, 'Mobile rows preserve card height and gaps');
  await send('Emulation.setDeviceMetricsOverride', { width: 1400, height: 900, deviceScaleFactor: 1, mobile: false });
  await waitFor(`(() => { const boxes = [...${cards}].map(a => a.getBoundingClientRect()); return boxes.length >= 6 && Math.abs(boxes[4].top-boxes[0].top)<2 && boxes[5].top>boxes[0].bottom; })()`);
  await evaluate('window.scrollTo(0, document.body.scrollHeight)');
  await waitFor(`!!document.querySelector('a[href="/movie/${expectedIds[71]}"]')`);
  console.log('PASS: Chrome mobile first-24 loading, Load more, ordinary grid rendering, row spacing, desktop resizing, and final loaded row.');
 } catch (error) {
  console.error('Collection browser failure:', error);
  if (evaluate) console.error(await evaluate(`JSON.stringify({url:location.href,scrollY:window.scrollY,links:[...document.querySelectorAll('main a')].map(a=>a.getAttribute('href')).slice(0,8),text:document.body.innerText.slice(0,500)})`).catch(() => 'No browser diagnostics'));
  throw error;
 } finally {
  socket?.close();
  chrome.kill();
  await new Promise(resolve => chrome.once('exit', resolve));
  await rm(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }).catch(error => console.warn('Temporary Chrome profile cleanup:', error.code));
 }
}
