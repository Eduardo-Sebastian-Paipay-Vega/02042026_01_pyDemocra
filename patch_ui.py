import os

file_path = 'src/modules/ong/app/pages/HoursApproval.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Imports
if 'import { Avatar' not in content:
    content = content.replace('import { toast } from "sonner";', 'import { toast } from "sonner";\nimport { Avatar, AvatarFallback, AvatarImage } from "@/core/components/ui/avatar";\nimport { Paperclip } from "lucide-react";')

# Update volunteer column
old_volunteer = """  {
    key: "volunteer",
    label: "Voluntario",
    render: (item) => <span style={{ color: "var(--t-text)" }}>{item.subjectName}</span>,
  },"""

new_volunteer = """  {
    key: "volunteer",
    label: "Voluntario",
    render: (item) => (
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${item.subjectName}`} alt={item.subjectName} />
          <AvatarFallback>{item.subjectName.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <span style={{ color: "var(--t-text)" }}>{item.subjectName}</span>
      </div>
    ),
  },"""
content = content.replace(old_volunteer, new_volunteer)

# Update activity column
old_activity = """  {
    key: "activity",
    label: "Actividad",
    render: (item) => (
      <div>
        <div style={{ color: "var(--t-text-secondary)" }}>{item.entityTitle}</div>
        <div className="mt-0.5 text-[11px]" style={{ color: "var(--t-text-dim)" }}>
          {item.entitySubtitle}
        </div>
      </div>
    ),
  },"""

new_activity = """  {
    key: "activity",
    label: "Actividad",
    render: (item) => (
      <div>
        <div className="flex items-center gap-2" style={{ color: "var(--t-text-secondary)" }}>
          {item.entityTitle}
          {item.hasEvidence && (
            <span className="flex items-center gap-1 rounded-full bg-blue-500/10 px-1.5 py-0.5 text-[10px] text-blue-500" title="Contiene evidencia adjunta">
              <Paperclip size={10} />
            </span>
          )}
        </div>
        <div className="mt-0.5 text-[11px]" style={{ color: "var(--t-text-dim)" }}>
          {item.entitySubtitle}
        </div>
      </div>
    ),
  },"""
content = content.replace(old_activity, new_activity)

# Wait, `Paperclip` might already be imported if I just added it. But I added it with `Avatar`.

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("done")
