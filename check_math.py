import codecs

with codecs.open('D:/espelo/Documento/proyecto_final_corregido.tex', 'r', 'utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if line.count('$') % 2 != 0:
        print(f'Line {i+1}: {line.strip()}')
