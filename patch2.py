import os

file_path = 'src/modules/ong/app/pages/HoursApproval.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('\n          emptyStateStyle', '')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("done")
