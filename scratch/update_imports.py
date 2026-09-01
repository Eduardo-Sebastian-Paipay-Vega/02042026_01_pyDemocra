import re

with open(r'D:\mela\02042026_01_pyDemocra\src\modules\ong\app\pages\SensitiveAccess.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add Tabs import
if 'import { Tabs, TabsList, TabsTrigger, TabsContent }' not in content:
    content = re.sub(
        r'(import \{ motion, type Variants \} from "motion/react";)',
        r'\1\nimport { Tabs, TabsList, TabsTrigger, TabsContent } from "@/core/components/ui/tabs";',
        content
    )

# 2. Add DatePicker Popover imports if we want to build a simple DateRangePicker in-place
if 'import { Popover, PopoverTrigger, PopoverContent }' not in content:
    content = re.sub(
        r'(import \{ Tabs, TabsList, TabsTrigger, TabsContent \} from "@/core/components/ui/tabs";)',
        r'\1\nimport { Popover, PopoverTrigger, PopoverContent } from "@/core/components/ui/popover";\nimport { Calendar } from "@/core/components/ui/calendar";\nimport { format } from "date-fns";\nimport { es } from "date-fns/locale";',
        content
    )

with open(r'D:\mela\02042026_01_pyDemocra\src\modules\ong\app\pages\SensitiveAccess.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
