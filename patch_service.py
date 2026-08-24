import re
import os

file_path = 'src/modules/ong/app/services/operacion/aprobaciones.service.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

if 'hasEvidence' not in content:
    content = re.sub(
        r'function mapApprovalRow\(\s*approval: ApprovalDbRow,\s*linkedHours: OperationHoursRow \| null,\s*profileLabels: Map<string, string>\s*\): OperationApprovalRow \{',
        'function mapApprovalRow(\n  approval: ApprovalDbRow,\n  linkedHours: OperationHoursRow | null,\n  profileLabels: Map<string, string>,\n  hasEvidence: boolean = false\n): OperationApprovalRow {',
        content
    )
    
    content = re.sub(
        r'approvedBy,\n  \};',
        'approvedBy,\n    hasEvidence,\n  };',
        content
    )

    fetch_evidences_code = """
    const linkedActivities = Array.from(hoursContext.byHoursId.values()).map(h => h.activityId).filter(Boolean);
    const linkedVolunteers = Array.from(hoursContext.byHoursId.values()).map(h => h.volunteerId).filter(Boolean);
    let evidenceRows: any[] = [];
    if (linkedActivities.length > 0 && linkedVolunteers.length > 0) {
      const { data } = await ongSchema()
        .from("evidencias_actividad")
        .select("id_actividad, id_voluntario")
        .eq("tenant_id", tenantId)
        .in("id_actividad", linkedActivities)
        .in("id_voluntario", linkedVolunteers);
      evidenceRows = data || [];
    }
    const hasEvidenceFn = (activityId?: string | null, volunteerId?: string | null) => {
      if (!activityId || !volunteerId) return false;
      return evidenceRows.some(e => e.id_actividad === activityId && e.id_voluntario === volunteerId);
    };
"""
    content = content.replace('const hoursContext = await loadHoursContext();\n    warnings.push(...hoursContext.warnings);', 'const hoursContext = await loadHoursContext();\n    warnings.push(...hoursContext.warnings);\n' + fetch_evidences_code)
    
    content = content.replace(
        'mapApprovalRow(approval, hoursContext.byHoursId.get(approval.entidad_id) ?? null, profileLabels)',
        'mapApprovalRow(approval, hoursContext.byHoursId.get(approval.entidad_id) ?? null, profileLabels, hasEvidenceFn((hoursContext.byHoursId.get(approval.entidad_id) ?? null)?.activityId, (hoursContext.byHoursId.get(approval.entidad_id) ?? null)?.volunteerId))'
    )

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
print("done")
