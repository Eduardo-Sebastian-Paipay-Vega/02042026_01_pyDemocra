import re

with open("ong/src/app/pages/Inventory.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update setItemForm in "Nuevo item" onClick
content = re.sub(
    r'(setItemForm\(\{\s*code:\s*)""',
    r'\1`INV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`',
    content
)

# 2. Update setItemForm initial state
# const [itemForm, setItemForm] = useState({ code: "", ...
content = re.sub(
    r'(const \[itemForm, setItemForm\] = useState\(\{\s*code:\s*)""',
    r'\1`INV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`',
    content
)

# 3. Remove the code input and make name take full width
old_input_block = """            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input value={itemForm.code} onChange={(event) => setItemForm((current) => ({ ...current, code: event.target.value }))} placeholder="Código (ej: INV-001, auto si vacío)" className="h-9 rounded-xl px-3 text-[12px] outline-none" style={{ border: "1px solid var(--t-border)", background: "var(--t-input-bg)", color: "var(--t-text-secondary)" }} />
              <input value={itemForm.name} onChange={(event) => setItemForm((current) => ({ ...current, name: event.target.value }))} placeholder="Nombre" className="h-9 rounded-xl px-3 text-[12px] outline-none" style={{ border: "1px solid var(--t-border)", background: "var(--t-input-bg)", color: "var(--t-text-secondary)" }} />
            </div>"""

new_input_block = """            <div className="grid grid-cols-1 gap-3">
              <input value={itemForm.name} onChange={(event) => setItemForm((current) => ({ ...current, name: event.target.value }))} placeholder="Nombre" className="h-9 rounded-xl px-3 text-[12px] outline-none" style={{ border: "1px solid var(--t-border)", background: "var(--t-input-bg)", color: "var(--t-text-secondary)" }} />
            </div>"""

# Handle encoding issues or slightly different characters (like ó vs )
# I will use a regex to replace the input block safely.

content = re.sub(
    r'<div className="grid grid-cols-1 gap-3 md:grid-cols-2">\s*<input value=\{itemForm\.code\}[^>]+>\s*<input value=\{itemForm\.name\}[^>]+>\s*</div>',
    r'<div className="grid grid-cols-1 gap-3">\n              <input value={itemForm.name} onChange={(event) => setItemForm((current) => ({ ...current, name: event.target.value }))} placeholder="Nombre" className="h-9 rounded-xl px-3 text-[12px] outline-none" style={{ border: "1px solid var(--t-border)", background: "var(--t-input-bg)", color: "var(--t-text-secondary)" }} />\n            </div>',
    content
)

# 4. Update the error message
content = content.replace(
    'Nombre, unidad y estado son obligatorios. El código se auto-genera si lo dejas vacío.',
    'Nombre, unidad y estado son obligatorios.'
)
content = content.replace(
    'Nombre, unidad y estado son obligatorios. El cdigo se auto-genera si lo dejas vaco.',
    'Nombre, unidad y estado son obligatorios.'
)

with open("ong/src/app/pages/Inventory.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Done")
