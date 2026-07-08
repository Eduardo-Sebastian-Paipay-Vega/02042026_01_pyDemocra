import fs from 'fs';
import path from 'path';

const pagesDir = path.join(process.cwd(), 'ong', 'src', 'app', 'pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.test.tsx') && f !== 'Areas.test.tsx');

for (const file of files) {
  fs.unlinkSync(path.join(pagesDir, file));
}
console.log('Deleted old generated tests.');
