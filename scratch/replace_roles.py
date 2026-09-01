import os, glob

replacements = {
    'var(--t-surface)': 'var(--color-bg-card)',
    'var(--t-border)': 'var(--color-border-subtle)',
    'var(--t-input-bg)': 'var(--color-bg-main)',
    'var(--t-text)': 'var(--color-text-primary)',
    'var(--t-text-secondary)': 'var(--color-text-secondary)',
    'var(--t-text-dim)': 'var(--color-text-muted)',
    'var(--t-hover)': 'var(--color-bg-hover)',
}

def replace_in_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    for old_val, new_val in replacements.items():
        content = content.replace(old_val, new_val)
    
    if content != original:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Updated {path}')

replace_in_file('ong/src/app/pages/Roles.tsx')
