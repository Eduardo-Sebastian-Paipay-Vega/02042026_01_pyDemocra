import codecs

with codecs.open('D:/espelo/Documento/proyecto_final_corregido.tex', 'r', 'utf-8') as f:
    text = f.read()

reps = [
    ('0.00 \\%$ \\\\', '0.00 \\% \\\\'),
    ('0.02 \\%$ \\\\', '0.02 \\% \\\\'),
    ('0.15 \\%$ \\\\', '0.15 \\% \\\\'),
    ('$1414.8 \\text{ ms} & $+4.22\\%$ \\\\', '14.8 \\text{ ms} & +4.22\\% \\\\'),
    ('$8585.4 \\text{ ms} & $+501.40\\%$ \\\\', '85.4 \\text{ ms} & +501.40\\% \\\\'),
    ('solo $4.22\\% de sobrecosto', 'solo 4.22\\% de sobrecosto'),
    ('un $100\\% de bloqueo', 'un 100\\% de bloqueo'),
    ('Puntuaci\\\'on Media Global ($\\mu$) & $840.5 \\\\', 'Puntuaci\\\'on Media Global ($\\mu$) & 840.5 \\\\'),
    ('M\\\'inimo Registrado & $720.5 \\\\', 'M\\\'inimo Registrado & 720.5 \\\\'),
    ('del $68.0$ es', 'de 68.0 es'),
    ('de $840.5 puntos', 'de 840.5 puntos'),
    ('un $87.5\\%.', 'un 87.5\\%.')
]

for src, dst in reps:
    text = text.replace(src, dst)

with codecs.open('D:/espelo/Documento/proyecto_final_corregido.tex', 'w', 'utf-8') as f:
    f.write(text)

print('Done replacing.')
