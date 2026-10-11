// Learning only: the same file read three ways. Not imported by the app.
// Run with: node playground/callbacks.js
import fs from 'node:fs';
import fsp from 'node:fs/promises';

const file = new URL('./notes.txt', import.meta.url);

// 1) Callback style: Node calls our function later, error first.
fs.readFile(file, 'utf8', (err, text) => {
  if (err) return console.error('callback error:', err.message);
  console.log('1. callback :', text.trim());

  // Doing a second step means nesting inside the first. This is how
  // "callback pyramids" start, with error checks at every level.
  fs.readFile(file, 'utf8', (err2, again) => {
    if (err2) return console.error('callback error:', err2.message);
    console.log('1b. nested  :', again.trim());
  });
});

// 2) Promise style: chain steps with .then and catch errors once.
fsp
  .readFile(file, 'utf8')
  .then((text) => console.log('2. promise  :', text.trim()))
  .catch((err) => console.error('promise error:', err.message));

// 3) async/await: promises again, but it reads top to bottom like normal code.
async function readWithAwait() {
  try {
    const text = await fsp.readFile(file, 'utf8');
    console.log('3. await    :', text.trim());
  } catch (err) {
    console.error('await error:', err.message);
  }
}
readWithAwait();

// Runs first: the three reads above are async, so Node moves on without waiting.
console.log('0. this line prints before any file is read');
