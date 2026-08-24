import os

file_path = 'src/modules/ong/app/components/shared/DataTable.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('emptyMessage?: string;', 'emptyMessage?: ReactNode;')
content = content.replace('<p className="text-[13px]" style={{ color: "var(--t-text-secondary)" }}>{emptyMessage}</p>', '{typeof emptyMessage === "string" ? <p className="text-[13px]" style={{ color: "var(--t-text-secondary)" }}>{emptyMessage}</p> : emptyMessage}')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("done")
