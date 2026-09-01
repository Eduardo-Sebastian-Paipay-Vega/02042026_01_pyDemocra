import os, glob, re

replacements = {
    '#100F0D': 'bg-main',
    '#171512': 'bg-card',
    '#1F1D1A': 'bg-hover',
    '#26231F': 'border-subtle',
    '#F9F7F3': 'text-primary',
    '#A4A29F': 'text-secondary',
    '#686561': 'text-muted',
    '#356C92': 'accent-primary',
    '#08996A': 'accent-emerald',
    '#8B5CF6': 'accent-purple',
    '#D97706': 'accent-amber',
}

def replace_in_file(path):
    with open(path, 'r', encoding='latin-1') as f:
        content = f.read()

    original = content
    for hex_code, token in replacements.items():
        if 'bg' in token:
            content = content.replace(f'bg-[{hex_code}]', f'bg-{token}')
            content = content.replace(f'dark:bg-[{hex_code}]', f'dark:bg-{token}')
            content = re.sub(fr'bg-\[{hex_code}\]/(\d+)', fr'bg-{token}/\1', content)
            content = re.sub(fr'dark:bg-\[{hex_code}\]/(\d+)', fr'dark:bg-{token}/\1', content)
        elif 'border' in token:
            content = content.replace(f'border-[{hex_code}]', f'border-{token}')
            content = content.replace(f'dark:border-[{hex_code}]', f'dark:border-{token}')
            content = re.sub(fr'border-\[{hex_code}\]/(\d+)', fr'border-{token}/\1', content)
            content = re.sub(fr'dark:border-\[{hex_code}\]/(\d+)', fr'dark:border-{token}/\1', content)
        elif 'text' in token:
            content = content.replace(f'text-[{hex_code}]', f'text-{token}')
            content = content.replace(f'dark:text-[{hex_code}]', f'dark:text-{token}')
            content = re.sub(fr'text-\[{hex_code}\]/(\d+)', fr'text-{token}/\1', content)
            content = re.sub(fr'dark:text-\[{hex_code}\]/(\d+)', fr'dark:text-{token}/\1', content)
        elif 'accent' in token:
            content = content.replace(f'text-[{hex_code}]', f'text-{token}')
            content = content.replace(f'dark:text-[{hex_code}]', f'dark:text-{token}')
            content = content.replace(f'bg-[{hex_code}]', f'bg-{token}')
            content = content.replace(f'dark:bg-[{hex_code}]', f'dark:bg-{token}')
            content = re.sub(fr'bg-\[{hex_code}\]/(\d+)', fr'bg-{token}/\1', content)
            content = re.sub(fr'dark:bg-\[{hex_code}\]/(\d+)', fr'dark:bg-{token}/\1', content)
            content = content.replace(f'border-[{hex_code}]', f'border-{token}')
            content = content.replace(f'dark:border-[{hex_code}]', f'dark:border-{token}')
            content = re.sub(fr'border-\[{hex_code}\]/(\d+)', fr'border-{token}/\1', content)
            content = re.sub(fr'dark:border-\[{hex_code}\]/(\d+)', fr'dark:border-{token}/\1', content)

    content = content.replace('bg-[#161D17]', 'bg-accent-emerald/10')
    content = content.replace('bg-[#1F181E]', 'bg-accent-purple/10')
    content = content.replace('bg-[#231C11]', 'bg-accent-amber/10')

    content = content.replace('\"#10b981\"', '\"var(--color-accent-emerald)\"')
    content = content.replace('\"#6366f1\"', '\"var(--color-accent-purple)\"')
    content = content.replace('\"#1F1D1A\"', '\"var(--color-bg-hover)\"')
    content = content.replace('\"#26231F\"', '\"var(--color-border-subtle)\"')
    content = content.replace('\"#F9F7F3\"', '\"var(--color-text-primary)\"')
    content = content.replace('\"#71717a\"', '\"var(--color-text-secondary)\"')
    
    if content != original:
        with open(path, 'w', encoding='latin-1') as f:
            f.write(content)
        print(f'Updated {path}')

files = glob.glob('ong/src/app/pages/Dashboard.tsx')
files.extend(glob.glob('ong/src/app/pages/components/*.tsx'))

for f in files:
    replace_in_file(f)
