import assert from 'node:assert';
import { test } from 'node:test';
import { splitText } from './split-text.ts';

test('short text is untouched', () => {
  assert.deepStrictEqual(splitText('hi', 10), ['hi']);
});

test('splits on whitespace and loses no words', () => {
  const text = 'aaa bbb ccc ddd eee fff';
  const chunks = splitText(text, 8);
  assert.ok(chunks.every((c) => c.length <= 8));
  assert.strictEqual(chunks.join(' '), text);
});

test('hard-cuts a single unbroken word', () => {
  assert.deepStrictEqual(splitText('x'.repeat(25), 10), ['x'.repeat(10), 'x'.repeat(10), 'x'.repeat(5)]);
});
