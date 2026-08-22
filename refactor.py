import re
import sys

def refactor_file(filepath, endpoint):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    match = re.search(r"import\s+\{([\s\S]*?)\}\s+from\s+'../../lib/mock-data'", content)
    if not match:
        print(f"No mock-data import found in {filepath}")
        return
        
    vars = [v.strip() for v in match.group(1).replace('\n', '').split(',') if v.strip()]
    
    # Replace import
    content = re.sub(
        r"import\s+\{[\s\S]*?\}\s+from\s+'../../lib/mock-data'",
        "import { fetchEducData } from '../../lib/api'",
        content
    )
    
    # Proxy code
    proxy_code = ""
    for v in vars:
        proxy_code += f"""
const {v} = new Proxy([] as any, {{
  get: (target, prop) => {{
    const realData = (window as any).__dashboardData?.{v};
    if (!realData) return undefined;
    const value = realData[prop];
    return typeof value === 'function' ? value.bind(realData) : value;
  }}
}});
"""

    content = content.replace(
        "import { fetchEducData } from '../../lib/api'",
        f"import {{ fetchEducData }} from '../../lib/api'\n\n// Proxies for lazy async data\n{proxy_code}"
    )

    # Inject useEffect
    content = re.sub(
        r"(export default function .*?\{)",
        f"\\1\n  const [data, setData] = useState<any>(null);\n  useEffect(() => {{\n    fetchEducData('{endpoint}').then(d => {{\n      (window as any).__dashboardData = d;\n      setData(d);\n    }}).catch(console.error);\n  }}, []);\n\n  if (!data) return <div style={{{{padding: 40, color: 'var(--tx-2)'}}}}>Cargando analíticas...</div>;\n",
        content
    )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"Refactored {filepath}")

refactor_file('educ/src/features/director/DashboardDirector.tsx', 'analytics/director')
refactor_file('educ/src/features/finanzas/DashboardCFO.tsx', 'analytics/cfo')
refactor_file('educ/src/features/coordinador/DashboardCoordinador.tsx', 'analytics/coordinador')
refactor_file('educ/src/features/padres/DashboardPadres.tsx', 'analytics/padres')
