import re
import os

file_path = 'src/modules/ong/app/pages/HoursApproval.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix encoding/typos
content = content.replace('AprobaciÃ³n', 'Aprobación')
content = content.replace('aprobaciÃ³n', 'aprobación')
content = content.replace('volviÃ³', 'volvió')
content = content.replace('acciÃ³n', 'acción')
content = content.replace('revisiÃ³n', 'revisión')
content = content.replace('resoluciÃ³n', 'resolución')
content = content.replace('GestiÃ³n', 'Gestión')
content = content.replace('Aprobacion ', 'Aprobación ')
content = content.replace('aprobacion ', 'aprobación ')

# Update layout of filters
old_layout = """      <motion.div variants={fadeUp}>
        <div className="flex flex-wrap gap-2">
          <select
            value={volunteerFilter}
            onChange={(event) => setVolunteerFilter(event.target.value)}
            className="h-9 rounded-xl px-3 text-[12px] outline-none"
            style={INPUT_STYLE}
          >
            {volunteerOptionsWithAll.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
            className="h-9 rounded-xl px-3 text-[12px] outline-none"
            style={INPUT_STYLE}
          />
          <input
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            className="h-9 rounded-xl px-3 text-[12px] outline-none"
            style={INPUT_STYLE}
          />
        </div>
      </motion.div>"""

new_layout = """      <motion.div variants={fadeUp}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="md:col-span-2">
            <select
              value={volunteerFilter}
              onChange={(event) => setVolunteerFilter(event.target.value)}
              className="h-9 w-full rounded-xl px-3 text-[12px] outline-none"
              style={INPUT_STYLE}
            >
              {volunteerOptionsWithAll.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-1">
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              className="h-9 w-full rounded-xl px-3 text-[12px] outline-none"
              style={INPUT_STYLE}
            />
          </div>
          <div className="md:col-span-1">
            <input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              className="h-9 w-full rounded-xl px-3 text-[12px] outline-none"
              style={INPUT_STYLE}
            />
          </div>
        </div>
      </motion.div>"""

content = content.replace(old_layout, new_layout)

# Empty message
old_empty = 'emptyMessage="No hay aprobaciones de horas para el filtro seleccionado"'
new_empty = 'emptyMessage={<EmptyState title="Sin resultados" description="No hay aprobaciones de horas para el filtro seleccionado." />}\n          emptyStateStyle'
content = content.replace(old_empty, new_empty)

# Import EmptyState
if 'EmptyState' not in content:
    content = content.replace('import { FilterBar } from "../components/shared/FilterBar";', 'import { FilterBar } from "../components/shared/FilterBar";\nimport { EmptyState } from "../components/shared/EmptyState";')

# Action button in Header
old_header = """      <motion.div variants={fadeUp}>
        <PageHeader
          title="Aprobación de horas"
          description="Gestión de aprobaciones para registros de horas de voluntarios. Resuelve, rechaza o devuelve a pendiente desde esta vista."
          action={{ label: "Actualizar", onClick: refresh }}
        />
      </motion.div>"""

new_header = """      <motion.div variants={fadeUp} className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <PageHeader
          title="Aprobación de horas"
          description="Gestión de aprobaciones para registros de horas de voluntarios. Resuelve, rechaza o devuelve a pendiente desde esta vista."
        />
        <OutlineButton size="sm" onClick={refresh} className="mt-2 flex items-center gap-2 md:mt-0" title="Sincronizar">
          <RefreshCw size={14} />
          <span>Sincronizar</span>
        </OutlineButton>
      </motion.div>"""

content = content.replace(old_header, new_header)

# Import RefreshCw
if 'RefreshCw' not in content:
    content = content.replace('import { toast } from "sonner";', 'import { toast } from "sonner";\nimport { RefreshCw } from "lucide-react";')

# Reject comment required
old_reject_comment = """    if (comment.length > 500) {
      setResolutionError("El comentario no puede exceder 500 caracteres.");
      return;
    }"""

new_reject_comment = """    if (resolutionTarget.action === "rejected" && !comment) {
      setResolutionError("El comentario es obligatorio para rechazar horas.");
      return;
    }
    if (comment.length > 500) {
      setResolutionError("El comentario no puede exceder 500 caracteres.");
      return;
    }"""
content = content.replace(old_reject_comment, new_reject_comment)

# Also update the modal text to specify the comment is required for rejection
old_modal_text = """El comentario es opcional y queda registrado en la aprobación y en el registro de horas."""
new_modal_text = """{resolutionTarget?.action === "rejected" ? "El comentario es obligatorio para justificar el rechazo." : "El comentario es opcional y queda registrado en la aprobación y en el registro de horas."}"""
content = content.replace(old_modal_text, new_modal_text)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("done")
