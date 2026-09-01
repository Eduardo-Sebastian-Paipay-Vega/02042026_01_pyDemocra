import re

file_path = r'D:\mela\02042026_01_pyDemocra\src\modules\ong\app\pages\SensitiveAccess.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix double imports
content = content.replace('import { format }\nimport { es }', '')
content = re.sub(r'import \{ format \} from "date-fns";\nimport \{ es \} from "date-fns/locale";\n', '', content)

# Add zod import
content = re.sub(
    r'import \{ toast \} from "sonner";',
    r'import { toast } from "sonner";\nimport { z } from "zod";',
    content
)

# Add zod schema
schema_code = r'''const constraintSchema = z.object({
  roleId: z.string().min(1, "El rol es obligatorio"),
  sedeId: z.string().optional(),
  ipCidr: z.string().optional(),
  requireTrustedDevice: z.boolean().optional(),
  timeStart: z.string().optional(),
  timeEnd: z.string().optional(),
}).refine(
  (data) => {
    if ((data.timeStart && !data.timeEnd) || (!data.timeStart && data.timeEnd)) {
      return false;
    }
    return true;
  },
  { message: "Debes completar tanto la hora de inicio como la de fin", path: ["timeEnd"] }
).refine(
  (data) => {
    if (data.timeStart && data.timeEnd) {
      return data.timeEnd > data.timeStart;
    }
    return true;
  },
  { message: "La hora de fin debe ser mayor a la hora de inicio", path: ["timeEnd"] }
).refine(
  (data) => {
    if (data.ipCidr && data.ipCidr.trim() !== "") {
      return /^[0-9a-fA-F.:/]+$/.test(data.ipCidr);
    }
    return true;
  },
  { message: "El CIDR/IP contiene caracteres no válidos", path: ["ipCidr"] }
);

function buildConstraintForm('''

content = content.replace('function buildConstraintForm(', schema_code)

# Update saveConstraint to use zod
save_constraint_search = r'''  async function saveConstraint\(\) \{
    try \{
      if \(editingConstraint\) \{'''
save_constraint_replace = r'''  async function saveConstraint() {
    try {
      constraintSchema.parse(constraintForm);
      if (editingConstraint) {'''
content = content.replace(save_constraint_search, save_constraint_replace)

# Handle ZodError
catch_search = r'''    \} catch \(saveError\) \{
      setConstraintError\(
        saveError instanceof Error
          \? saveError\.message
          : "No se pudo guardar la restriccion\."
      \);
    \}'''
catch_replace = r'''    } catch (saveError: any) {
      if (saveError instanceof z.ZodError) {
        setConstraintError(saveError.errors[0].message);
      } else {
        setConstraintError(
          saveError instanceof Error
            ? saveError.message
            : "No se pudo guardar la restriccion."
        );
      }
    }'''
content = content.replace(catch_search, catch_replace)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
