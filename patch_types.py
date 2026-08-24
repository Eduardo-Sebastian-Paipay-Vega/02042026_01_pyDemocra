import os

file_path = 'src/modules/ong/app/modules/operation/types.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

if 'hasEvidence?: boolean;' not in content:
    content = content.replace('comment: string;', 'comment: string;\n  hasEvidence?: boolean;')
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
print("done")
