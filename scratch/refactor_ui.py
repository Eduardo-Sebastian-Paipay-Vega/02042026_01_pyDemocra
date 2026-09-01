import re

file_path = r'D:\mela\02042026_01_pyDemocra\src\modules\ong\app\pages\SensitiveAccess.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add DatePickerWithRange import and date-fns
if 'import { DatePickerWithRange }' not in content:
    content = re.sub(
        r'import \{ Tabs, TabsList, TabsTrigger, TabsContent \} from "@/core/components/ui/tabs";',
        r'import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/core/components/ui/tabs";\nimport { DatePickerWithRange } from "@/core/components/ui/date-range-picker";\nimport { formatDistanceToNow } from "date-fns";\nimport { es } from "date-fns/locale";\nimport type { DateRange } from "react-day-picker";',
        content
    )

# Modify logColumns for FECHA column to include relative time
date_column_search = r'''  \{
    key: "date",
    label: "Fecha",
    render: \(row\) => \(
      <span className="text-\[12px\]" style=\{\{ color: "var\(--t-text-secondary\)" \}\}>
        \{row\.accessedAtLabel\}
      </span>
    \),
  \},'''
date_column_replace = r'''  {
    key: "date",
    label: "Fecha",
    render: (row) => {
      let relativeTime = "";
      try {
        if (row.accessedAt) {
          relativeTime = formatDistanceToNow(new Date(row.accessedAt), { addSuffix: true, locale: es });
        }
      } catch (e) {
        relativeTime = "";
      }
      return (
        <div className="flex flex-col">
          <span className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
            {row.accessedAtLabel}
          </span>
          {relativeTime && (
            <span className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
              {relativeTime}
            </span>
          )}
        </div>
      );
    },
  },'''
content = content.replace(date_column_search, date_column_replace)

# Date filter state change
date_state_search = r'''  const \[dateFrom, setDateFrom\] = useState\(""\);
  const \[dateTo, setDateTo\] = useState\(""\);'''
date_state_replace = r'''  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const dateFrom = dateRange?.from ? dateRange.from.toISOString().split("T")[0] : "";
  const dateTo = dateRange?.to ? dateRange.to.toISOString().split("T")[0] : "";'''
content = re.sub(date_state_search, date_state_replace, content)

# Remove the data.warnings banner
warnings_banner_search = r'''          \{data\.warnings\.length > 0 && \(
            <p className="mt-2 text-\[12px\]" style=\{\{ color: "var\(--t-text-dim\)" \}\}>
              \{data\.warnings\.join\(" "\)\}
            </p>
          \)\}'''
warnings_banner_replace = r'''          {/* Warnings removed for security. Access denied handled below */}'''
content = re.sub(warnings_banner_search, warnings_banner_replace, content)

# Remove 'governance.sensitive.read...' from banner
notes_search = r'''          <p className="mt-2 text-\[12px\]" style=\{\{ color: "var\(--t-text-dim\)" \}\}>
            `governance.sensitive.read` habilita la bitacora consolidada. `settings.roles.read` y `settings.roles.manage` controlan la lectura y mutacion de `public.role_access_constraints`.
          </p>'''
notes_replace = r''''''
content = re.sub(notes_search, notes_replace, content)

# Filter layout with DateRangePicker
filter_layout_search = r'''              <input
                type="date"
                value=\{dateFrom\}
                onChange=\{\(event\) => setDateFrom\(event\.target\.value\)\}
                className="h-9 rounded-xl px-3 text-\[12px\] outline-none"
                style=\{\{
                  border: "1px solid var\(--t-border\)",
                  background: "var\(--t-input-bg\)",
                  color: "var\(--t-text-secondary\)",
                \}\}
              />
              <input
                type="date"
                value=\{dateTo\}
                onChange=\{\(event\) => setDateTo\(event\.target\.value\)\}
                className="h-9 rounded-xl px-3 text-\[12px\] outline-none"
                style=\{\{
                  border: "1px solid var\(--t-border\)",
                  background: "var\(--t-input-bg\)",
                  color: "var\(--t-text-secondary\)",
                \}\}
              />'''
filter_layout_replace = r'''              <DatePickerWithRange date={dateRange} setDate={setDateRange} />'''
content = re.sub(filter_layout_search, filter_layout_replace, content)

# Wrap content in Tabs
tabs_open_replace = r'''      <Tabs defaultValue="logs" className="space-y-6">
        <motion.div variants={fadeUp}>
          <TabsList>
            <TabsTrigger value="logs">Historial de Accesos</TabsTrigger>
            <TabsTrigger value="constraints">Restricciones por Rol</TabsTrigger>
          </TabsList>
        </motion.div>

        <TabsContent value="logs" className="m-0 space-y-6">'''
# Find the start of the first module
content = content.replace(r'''      {error && (
        <motion.div variants={fadeUp}>
          <GovernanceErrorBlock message={error} onRetry={refresh} />
        </motion.div>
      )}

      <motion.div variants={fadeUp}>
        <div
          className="rounded-2xl p-4"''', tabs_open_replace + r'''
          {error && (
            <motion.div variants={fadeUp}>
              <GovernanceErrorBlock message={error} onRetry={refresh} />
            </motion.div>
          )}

          <motion.div variants={fadeUp}>
            <div
              className="rounded-2xl p-4"''')

# Close logs tab and open constraints tab
tabs_mid_replace = r'''        </TabsContent>

        <TabsContent value="constraints" className="m-0 space-y-6">
          <motion.div variants={fadeUp}>
            <div
              className="rounded-2xl p-4"'''
content = content.replace(r'''      <motion.div variants={fadeUp}>
        <div
          className="rounded-2xl p-4"
          style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <LockKeyhole className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />''', tabs_mid_replace + r'''
              style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <LockKeyhole className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />''')

# Close constraints tab before modals
tabs_close_replace = r'''        </TabsContent>
      </Tabs>

      <ModalShell'''
content = content.replace(r'''      <ModalShell
        open={Boolean(selectedLog)}''', tabs_close_replace + r'''
        open={Boolean(selectedLog)}''')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
