import os, re

files_data = {
    'educ/src/features/docente/DashboardDocente.tsx': {
        'react': ['useState', 'useEffect'],
        'recharts': ['BarChart', 'Bar', 'LineChart', 'Line', 'XAxis', 'YAxis', 'CartesianGrid', 'Tooltip', 'ResponsiveContainer', 'PieChart', 'Pie', 'Cell'],
        'lucide': ['TrendingUp', 'TrendingDown', 'Users', 'BookOpen', 'AlertTriangle', 'CheckCircle2', 'XCircle', 'Clock', 'ChevronRight', 'Download', 'MessageSquare', 'Calendar', 'Award'],
        'mock': ['misClasesDocente', 'estudiantesRiesgo', 'calificaciones10A', 'asistencia10A', 'comunicaciones', 'cursosDocente'],
        'endpoint': 'analytics/docente'
    },
    'educ/src/features/finanzas/components/DashboardCFO.tsx': {
        'react': ['useState', 'useEffect'],
        'recharts': ['BarChart', 'Bar', 'LineChart', 'Line', 'XAxis', 'YAxis', 'CartesianGrid', 'Tooltip', 'ResponsiveContainer', 'PieChart', 'Pie', 'Cell'],
        'lucide': ['TrendingUp', 'TrendingDown', 'DollarSign', 'Users', 'AlertTriangle', 'RefreshCw', 'Bot', 'CheckCircle2', 'XCircle', 'Clock', 'ArrowUpRight', 'ArrowDownRight', 'Download', 'Search', 'Filter', 'ChevronRight', 'Building2'],
        'mock': ['kpisCFO', 'canalesPago', 'flujoCaja', 'deudorScore', 'agentesIA', 'transacciones', 'deudores'],
        'endpoint': 'analytics/cfo'
    }
}

for filepath, data in files_data.items():
    if not os.path.exists(filepath): continue
    with open(filepath, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Replace the import from mock-data
    content = re.sub(r"import\s+\{[\s\S]*?\}\s+from\s+['\"](\.\./\.\./lib/mock-data|@educ/lib/mock-data)['\"]", "", content)
    
    # 2. Build the correct imports block
    imports = f"import {{ {', '.join(data['react'])} }} from 'react'\n"
    imports += f"import {{ {', '.join(data['recharts'])} }} from 'recharts'\n"
    imports += f"import {{ {', '.join(data['lucide'])} }} from 'lucide-react'\n"
    imports += "import { fetchEducData } from '../../lib/api'\n\n"
    
    # 3. Build the proxies for ONLY the mock data
    proxy_code = "// Proxies for lazy async data\n"
    for v in data['mock']:
        proxy_code += f"""const {v} = new Proxy([] as any, {{
  get: (target, prop) => {{
    const realData = (window as any).__dashboardData?.{v};
    if (!realData) return undefined;
    const value = realData[prop];
    return typeof value === 'function' ? value.bind(realData) : value;
  }}
}});
"""
    
    # Strip existing react/lucide/recharts imports to avoid duplicates at top
    content = re.sub(r"import \{[\s\S]*?\} from 'react'\n", "", content)
    content = re.sub(r"import \{[\s\S]*?\} from 'recharts'\n", "", content)
    content = re.sub(r"import \{[\s\S]*?\} from 'lucide-react'\n", "", content)
    
    # 4. Find the top of the file (first character) and insert imports and proxy code
    content = imports + proxy_code + content
    
    # Inject useEffect
    content = re.sub(
        r"(export default function .*?\{)",
        f"\\1\n  const [data, setData] = useState<any>(null);\n  useEffect(() => {{\n    fetchEducData('{data['endpoint']}').then(d => {{\n      (window as any).__dashboardData = d;\n      setData(d);\n    }}).catch(console.error);\n  }}, []);\n\n  if (!data) return <div style={{{{padding: 40, color: 'var(--tx-2)'}}}}>Cargando analíticas...</div>;\n",
        content
    )

    with open(filepath, 'w', encoding='utf-8') as file:
        file.write(content)
        
    print(f"Fixed {filepath}")
