import os
import re

with open('src/modules/ong/app/services/operacion/horas.service.ts', 'r', encoding='utf-8') as f:
    text = f.read()

for match in re.finditer(r'async function loadVolunteer.*?\}', text, re.DOTALL):
    print(match.group(0))
    break
