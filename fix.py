import os, re

files_data = {
    'educ/src/features/director/DashboardDirector.tsx': {
        'react': ['useState', 'useEffect'],
        'recharts': ['LineChart', 'Line', 'BarChart', 'Bar', 'PieChart', 'Pie', 'Cell', 'XAxis', 'YAxis', 'CartesianGrid', 'Tooltip', 'ResponsiveContainer'],
        'lucide': ['TrendingUp', 'TrendingDown', 'Users', 'BookOpen', 'AlertTriangle', 'DollarSign', 'ChevronRight', 'Download', 'RefreshCw', 'MoreHorizontal', 'Fingerprint', 'ShoppingBag', 'Bot', 'BarChart2', 'CheckCircle2', 'Clock', 'XCircle', 'ArrowUpRight', 'ArrowDownRight', 'Star', 'Trophy', 'Zap', 'Target', 'Globe', 'Eye', 'Database', 'Lock', 'Heart', 'Leaf', 'Map', 'Calendar', 'Award', 'GraduationCap', 'Landmark', 'Monitor', 'Thermometer', 'QrCode', 'MessageSquare'],
        'mock': ['kpisDirector', 'retencionData', 'financieroYTD', 'riesgoDistribucion', 'docentes', 'marketplaceProducts', 'pasaporteData', 'analyticsCanales', 'logrosCompartidos', 'agentesIA', 'usuarios', 'deudores', 'ewsStudents', 'badges', 'leaderboard', 'misiones'],
        'endpoint': 'analytics/director'
    },
    'educ/src/features/finanzas/DashboardCFO.tsx': {
        'react': ['useState', 'useEffect'],
        'recharts': ['BarChart', 'Bar', 'LineChart', 'Line', 'XAxis', 'YAxis', 'CartesianGrid', 'Tooltip', 'ResponsiveContainer', 'PieChart', 'Pie', 'Cell'],
        'lucide': ['TrendingUp', 'TrendingDown', 'DollarSign', 'Users', 'AlertTriangle', 'RefreshCw', 'Bot', 'CheckCircle2', 'XCircle', 'Clock', 'ArrowUpRight', 'ArrowDownRight', 'Download', 'Search', 'Filter', 'ChevronRight', 'Building2'],
        'mock': ['kpisCFO', 'canalesPago', 'flujoCaja', 'riesgoDistribucion', 'deudorScore', 'agentesIA', 'transacciones', 'deudores'],
        'endpoint': 'analytics/cfo'
    },
    'educ/src/features/coordinador/DashboardCoordinador.tsx': {
        'react': ['useState', 'useEffect'],
        'recharts': ['LineChart', 'Line', 'XAxis', 'YAxis', 'CartesianGrid', 'Tooltip', 'ResponsiveContainer', 'BarChart', 'Bar'],
        'lucide': ['TrendingUp', 'Users', 'CreditCard', 'AlertTriangle', 'ChevronRight', 'CheckCircle2', 'XCircle', 'Clock'],
        'mock': ['kpisCFO', 'evolucionMatricula', 'secciones10', 'deudores'],
        'endpoint': 'analytics/coordinador'
    },
    'educ/src/features/padres/DashboardPadres.tsx': {
        'react': ['useState', 'useEffect'],
        'recharts': ['ResponsiveContainer', 'BarChart', 'Bar', 'XAxis', 'YAxis', 'Tooltip', 'CartesianGrid', 'RadarChart', 'Radar', 'PolarGrid', 'PolarAngleAxis', 'PolarRadiusAxis'],
        'lucide': ['TrendingUp', 'TrendingDown', 'Minus', 'Download', 'CheckCircle2', 'XCircle', 'ChevronRight', 'Clock', 'AlertTriangle', 'MessageSquare', 'Calendar', 'Award', 'BookOpen', 'Star'],
        'mock': ['kpisDirector', 'radarData', 'comunicaciones', 'deudores'],
        'endpoint': 'analytics/padres'
    }
}

for filepath, data in files_data.items():
    if not os.path.exists(filepath): continue
    with open(filepath, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # 1. Strip ALL proxies and the `import { fetchEducData } from '../../lib/api'` line
    content = re.sub(r'const .*? = new Proxy\(\[\] as any, \{[\s\S]*?return typeof value === \'function\' \? value\.bind\(realData\) : value;\n  \}\n\}\);\n', '', content)
    content = re.sub(r"import \{ fetchEducData \} from '../../lib/api'\n*", "", content)
    content = re.sub(r"// Proxies for lazy async data\n*", "", content)
    
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
    
    # 4. Find the top of the file (first character) and insert imports and proxy code
    content = imports + proxy_code + content
    
    # 5. Fix the bad import from react that got broken in some files:
    # `const useEffect } from 'react'import {  LineChart = new Proxy` -> this was already stripped, but wait, the line itself might be mangled.
    content = re.sub(r'const .*? \} from \'react\'import \{ .*?', '', content)
    
    with open(filepath, 'w', encoding='utf-8') as file:
        file.write(content)
        
    print(f"Fixed {filepath}")
