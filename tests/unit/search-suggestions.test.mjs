import assert from 'node:assert/strict';
import test from 'node:test';
import { registerSuggestionDismissal } from '../../src/features/movies/search-suggestions.events.ts';

function setup() {
 const document = new EventTarget();
 const input = {};
 const poster = {};
 const link = {};
 const outside = {};
 const inside = new Set([input, poster, link]);
 const container = { ownerDocument: document, contains: target => inside.has(target) };
 let dismissals = 0;
 const cleanup = registerSuggestionDismissal(container, () => dismissals++);
 const dispatch = (type, target) => {
  const event = new Event(type);
  Object.defineProperty(event, 'target', { value: target });
  document.dispatchEvent(event);
 };
 return { input, poster, link, outside, dispatch, cleanup, dismissed: () => dismissals };
}

test('mobile touch/blur sequence keeps suggestions mounted until the link click', () => {
 const f = setup();
 try {
  f.dispatch('pointerdown', f.poster);
  f.dispatch('blur', f.input); // Mobile browsers may omit relatedTarget entirely.
  f.dispatch('focusout', f.input);
  f.dispatch('pointerup', f.poster);
  f.dispatch('click', f.link);
  assert.equal(f.dismissed(), 0, 'A tap inside must not dismiss before link activation');
 } finally { f.cleanup(); }
});

test('scrolling and focusing suggestions do not dismiss them', () => {
 const f = setup();
 try {
  f.dispatch('pointerdown', f.link);
  f.dispatch('pointercancel', f.link); // A drag becomes native touch scrolling.
  f.dispatch('focusin', f.link);
  assert.equal(f.dismissed(), 0);
 } finally { f.cleanup(); }
});

test('outside touch and keyboard focus both dismiss suggestions', () => {
 const f = setup();
 try {
  f.dispatch('pointerdown', f.outside);
  assert.equal(f.dismissed(), 1);
  f.dispatch('focusin', f.outside);
  assert.equal(f.dismissed(), 2);
 } finally { f.cleanup(); }
});

test('cleanup removes outside interaction listeners', () => {
 const f = setup();
 f.cleanup();
 f.dispatch('pointerdown', f.outside);
 f.dispatch('focusin', f.outside);
 assert.equal(f.dismissed(), 0);
});
