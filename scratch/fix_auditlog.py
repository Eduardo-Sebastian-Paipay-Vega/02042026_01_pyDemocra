import re

file_path = r'D:\mela\02042026_01_pyDemocra\src\modules\ong\app\pages\AuditLog.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix Line 40-42
search1 = r'''        <div style=\{\{ color: "var\(--t-text\)" \}\}>\{row\.schemaName\}\.\{row\.tableName\}</div>
        <div className="mt-0\.5 text-\[11px\]" style=\{\{ color: "var\(--t-text-dim\)" \}\}>
          \{row\.recordPk \? 'PK: ' \+ row\.recordPk : ""\}
        </div>'''
replace1 = r'''        <div style={{ color: "var(--t-text)" }}>{`${row.schemaName}.${row.tableName}`}</div>
        <div className="mt-0.5 text-[11px]" style={{ color: "var(--t-text-dim)" }}>
          {row.recordPk ? `PK: ${row.recordPk}` : ""}
        </div>'''
content = re.sub(search1, replace1, content)

# Fix Line 264-267
search2 = r'''                <GovernanceDetailField
                  label="Entidad"
                  value=\{`\$\{detailRow\.schemaName\}\.\$\{detailRow\.tableName\}`\}
                />'''
replace2 = r'''                <GovernanceDetailField
                  label="Entidad"
                  value={detailRow.schemaName + "." + detailRow.tableName}
                />'''
content = re.sub(search2, replace2, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
