const fs = require('fs');

let content = fs.readFileSync('ong/src/app/pages/Inventory.tsx', 'utf-8');

const regex = /<div className="grid grid-cols-1 gap-3 md:grid-cols-2">\s*<input value=\{itemForm\.code\}[\s\S]*?<input value=\{itemForm\.name\}[\s\S]*?<\/div>/;
const newBlock = `<div className="grid grid-cols-1 gap-3">
            <input value={itemForm.name} onChange={(event) => setItemForm((current) => ({ ...current, name: event.target.value }))} placeholder="Nombre" className="h-9 rounded-xl px-3 text-[12px] outline-none" style={{ border: "1px solid var(--t-border)", background: "var(--t-input-bg)", color: "var(--t-text-secondary)" }} />
          </div>`;

content = content.replace(regex, newBlock);
fs.writeFileSync('ong/src/app/pages/Inventory.tsx', content, 'utf-8');
console.log('Fixed block');
