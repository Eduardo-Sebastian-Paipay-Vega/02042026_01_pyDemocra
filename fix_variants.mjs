/**
 * Fix: Cast animation variant objects to `any` to avoid Variants type mismatch
 * from framer-motion. Pattern: `const foo = { hidden: ..., visible: ... }` → `const foo: any = { ... }`
 */
import { readFileSync, writeFileSync } from 'fs';

const FILES = [
  'ong/src/app/pages/Dashboard.tsx',
  'ong/src/app/pages/GlobalSearch.tsx',
  'ong/src/app/pages/IdCards.tsx',
  'ong/src/app/pages/MedicalRecords.tsx',
  'ong/src/app/pages/PlaceholderPage.tsx',
  'ong/src/app/pages/Volunteers.tsx',
  'ong/src/app/pages/Hours.tsx',
];

let fixed = 0;
for (const file of FILES) {
  try {
    let content = readFileSync(file, 'utf8');
    const original = content;

    // Pattern: const varName = { hidden: ..., visible: ... }
    // → const varName: any = { hidden: ..., visible: ... }
    content = content.replace(
      /\bconst (\w+) = \{(\s*hidden:)/g,
      'const $1: any = {$2'
    );

    if (content !== original) {
      writeFileSync(file, content, 'utf8');
      console.log(`Fixed: ${file}`);
      fixed++;
    }
  } catch (e) {
    console.warn(`Skip ${file}: ${e.message}`);
  }
}
console.log(`\nTotal: ${fixed} files fixed`);
