import re
import os
file_path = 'src/modules/ong/app/services/operacion/aprobaciones.service.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# I messed up the regex for return object.
content = re.sub(
    r'approvedBy,\n    approvedAt:(.*?)\n    comment:(.*?)\n  \};',
    r'approvedBy,\n    approvedAt:\1\n    comment:\2\n    hasEvidence,\n  };',
    content, flags=re.DOTALL
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("done")
