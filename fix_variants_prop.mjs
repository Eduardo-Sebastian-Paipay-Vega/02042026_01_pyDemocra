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

    content = content.replace(/variants=\{([a-zA-Z0-9_]+)\}/g, 'variants={$1 as any}');

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
