const fs = require('fs');
let content = fs.readFileSync('ong/src/app/pages/Inventory.tsx', 'utf-8');

// 1. In setItemForm( { code: "" ... } )
content = content.replace(/(setItemForm\(\{\s*code:\s*)""/g, 
  "$1`INV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`");

// 2. In useState( { code: "" ... } )
content = content.replace(/(const \[itemForm, setItemForm\] = useState\(\{\s*code:\s*)""/g, 
  "$1`INV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`");

// 3. Replace the whole input group
const regexBlock = /<div className="grid grid-cols-1 gap-3 md:grid-cols-2">\s*<input value=\{itemForm\.code\}[^>]+>\s*<input value=\{itemForm\.name\}[^>]+>\s*<\/div>/g;
const replacement = `<div className="grid grid-cols-1 gap-3">
              <input value={itemForm.name} onChange={(event) => setItemForm((current) => ({ ...current, name: event.target.value }))} placeholder="Nombre" className="h-9 rounded-xl px-3 text-[12px] outline-none" style={{ border: "1px solid var(--t-border)", background: "var(--t-input-bg)", color: "var(--t-text-secondary)" }} />
            </div>`;

content = content.replace(regexBlock, replacement);

// 4. Update the error message
content = content.replace(
  'Nombre, unidad y estado son obligatorios. El c\\u00f3digo se auto-genera si lo dejas vac\\u00edo.',
  'Nombre, unidad y estado son obligatorios.'
);
content = content.replace(
  /Nombre, unidad y estado son obligatorios\.[^\.]+\./g,
  'Nombre, unidad y estado son obligatorios.'
);

fs.writeFileSync('ong/src/app/pages/Inventory.tsx', content, 'utf-8');
console.log("Done");
