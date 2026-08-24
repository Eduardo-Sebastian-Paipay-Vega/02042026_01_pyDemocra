/**
 * Fix TS2698: Spread types may only be created from object types
 * in vi.mock calls with `...actual` pattern.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

function walkFiles(dir, exts = ['.ts', '.tsx']) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules') {
      results.push(...walkFiles(full, exts));
    } else if (stat.isFile() && exts.some(e => entry.endsWith(e))) {
      results.push(full);
    }
  }
  return results;
}

// Only process test files
const testFiles = walkFiles('ong/src').filter(f => f.endsWith('.test.tsx') || f.endsWith('.test.ts'));

let fixed = 0;
for (const file of testFiles) {
  let content = readFileSync(file, 'utf8');
  const original = content;

  // Fix: `const actual = await importOriginal();` → `const actual = await importOriginal() as any;`
  content = content.replace(
    /const actual = await importOriginal\(\);/g,
    'const actual = await importOriginal() as any;'
  );

  if (content !== original) {
    writeFileSync(file, content, 'utf8');
    console.log(`Fixed: ${file}`);
    fixed++;
  }
}

console.log(`\nTotal fixed: ${fixed} files`);
