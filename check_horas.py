import os
with open('src/modules/ong/app/services/operacion/horas.service.ts', 'r', encoding='utf-8') as f:
    text = f.read()
import re
match = re.search(r'function listHorasRows.*?\}', text, re.DOTALL)
if match:
    print(match.group(0))
