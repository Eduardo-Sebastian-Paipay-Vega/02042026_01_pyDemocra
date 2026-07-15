import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const modulesDir = path.join(__dirname, 'ong', 'src', 'app', 'modules');
const modules = fs.readdirSync(modulesDir);

let fixedCount = 0;

for (const module of modules) {
  const hooksDir = path.join(modulesDir, module, 'hooks');
  if (!fs.existsSync(hooksDir)) continue;

  const files = fs.readdirSync(hooksDir).filter(f => f.endsWith('.test.ts') && !f.includes('shared'));

  for (const file of files) {
    const filePath = path.join(hooksDir, file);
    let content = fs.readFileSync(filePath, 'utf-8');

    // Skip if it doesn't look like our generated test
    if (!content.includes('await new Promise((resolve) => setTimeout(resolve, 0));')) {
      continue;
    }

    // Add waitFor to import
    if (content.includes('renderHook, act }')) {
      content = content.replace('renderHook, act }', 'renderHook, act, waitFor }');
    }

    // Fix "maneja resolucion exitosa"
    content = content.replace(
      /await act\(async \(\) => \{\s+await new Promise\(\(resolve\) => setTimeout\(resolve, 0\)\);\s+\}\);/g,
      'await waitFor(() => expect(result.current.loading).toBe(false));'
    );
    
    // Fix "activa reloadToken" - here we do need to call refresh inside act, then waitFor
    content = content.replace(
      /await act\(async \(\) => \{\s+result\.current\.refresh\(\);\s+await new Promise\(\(resolve\) => setTimeout\(resolve, 0\)\);\s+\}\);/g,
      'act(() => { result.current.refresh(); });\n    await waitFor(() => expect(result.current.loading).toBe(false));'
    );

    fs.writeFileSync(filePath, content);
    fixedCount++;
    console.log("Fixed " + file);
  }
}

console.log("\\nFixed " + fixedCount + " files.");
