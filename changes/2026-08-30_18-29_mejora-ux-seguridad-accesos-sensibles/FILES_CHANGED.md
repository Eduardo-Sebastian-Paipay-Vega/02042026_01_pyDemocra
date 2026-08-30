# FILES CHANGED

- ong/src/app/pages/SensitiveAccess.tsx
  - Se modificó la interfaz para reemplazar el GovernanceErrorBlock expuesto a SQL por un mensaje genérico.
  - Se añadieron Tabs, TabsList, TabsContent y TabsTrigger para separar secciones.
  - Se introdujo DatePickerWithRange reemplazando los inputs de tipo date manuales.
  - Se enriquecieron las columnas date y created usando formatDistanceToNow y locale es.
  - Se introdujo un esquema de zod para validar el formulario constraintForm.
