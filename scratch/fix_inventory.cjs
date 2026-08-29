const fs = require('fs');

let content = fs.readFileSync('ong/src/app/pages/Inventory.tsx', 'utf-8');

// Replace the setItemForm initial state
content = content.replace(
  'const [itemForm, setItemForm] = useState({ code: "", name: "", description: "", unitCode: "", stateCode: "", active: true, imageUrl: "", imageFile: null as File | null });',
  'const [itemForm, setItemForm] = useState({ code: `INV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`, name: "", description: "", unitCode: "", stateCode: "", active: true, imageUrl: "", imageFile: null as File | null });'
);

// Replace the setItemForm in onClick for Nuevo item
content = content.replace(
  'onClick: () => { setEditingItem(null); setItemForm({ code: "", name: "", description: "", unitCode: items.unitOptions[0]?.value ?? "", stateCode: items.stateOptions[0]?.value ?? "", active: true, imageUrl: "", imageFile: null }); setItemError(null); setItemFormOpen(true); },',
  'onClick: () => { setEditingItem(null); setItemForm({ code: `INV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`, name: "", description: "", unitCode: items.unitOptions[0]?.value ?? "", stateCode: items.stateOptions[0]?.value ?? "", active: true, imageUrl: "", imageFile: null }); setItemError(null); setItemFormOpen(true); },'
);

// Remove the input and make name take 1 column
const blockToReplace = `<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input value={itemForm.code} onChange={(event) => setItemForm((current) => ({ ...current, code: event.target.value }))} placeholder="Código (ej: INV-001, auto si vacío)" className="h-9 rounded-xl px-3 text-[12px] outline-none" style={{ border: "1px solid var(--t-border)", background: "var(--t-input-bg)", color: "var(--t-text-secondary)" }} />
            <input value={itemForm.name} onChange={(event) => setItemForm((current) => ({ ...current, name: event.target.value }))} placeholder="Nombre" className="h-9 rounded-xl px-3 text-[12px] outline-none" style={{ border: "1px solid var(--t-border)", background: "var(--t-input-bg)", color: "var(--t-text-secondary)" }} />
          </div>`;

const blockWithMessedEncoding = `<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input value={itemForm.code} onChange={(event) => setItemForm((current) => ({ ...current, code: event.target.value }))} placeholder="Cdigo (ej: INV-001, auto si vaco)" className="h-9 rounded-xl px-3 text-[12px] outline-none" style={{ border: "1px solid var(--t-border)", background: "var(--t-input-bg)", color: "var(--t-text-secondary)" }} />
            <input value={itemForm.name} onChange={(event) => setItemForm((current) => ({ ...current, name: event.target.value }))} placeholder="Nombre" className="h-9 rounded-xl px-3 text-[12px] outline-none" style={{ border: "1px solid var(--t-border)", background: "var(--t-input-bg)", color: "var(--t-text-secondary)" }} />
          </div>`;

const newBlock = `<div className="grid grid-cols-1 gap-3">
            <input value={itemForm.name} onChange={(event) => setItemForm((current) => ({ ...current, name: event.target.value }))} placeholder="Nombre" className="h-9 rounded-xl px-3 text-[12px] outline-none" style={{ border: "1px solid var(--t-border)", background: "var(--t-input-bg)", color: "var(--t-text-secondary)" }} />
          </div>`;

// We use regex to match both valid utf-8 and broken chars
content = content.replace(
  /<div className="grid grid-cols-1 gap-3 md:grid-cols-2">\s*<input value=\{itemForm\.code\}[^>]+>\s*<input value=\{itemForm\.name\}[^>]+>\s*<\/div>/,
  newBlock
);

// Update error message
content = content.replace(
  /Nombre, unidad y estado son obligatorios[^"]+"/,
  'Nombre, unidad y estado son obligatorios."'
);

fs.writeFileSync('ong/src/app/pages/Inventory.tsx', content, 'utf-8');
console.log("Done");
