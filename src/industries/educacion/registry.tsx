import type { IndustryDefinition } from '../../core/tenant/registry-types';
import { EducacionShell } from './EducacionShell';

export const INDUSTRY_DEFINITION: IndustryDefinition = {
  id: "educacion",
  name: "Educación",
  description: "Vertical para Instituciones Educativas y Colegios",
  icon: "GraduationCap", 
  modules: [], 
  shell: EducacionShell, 
  theme: {
    primary: "blue-600",
    secondary: "indigo-600"
  },
  roles: [
    {
      id: "director",
      name: "Director",
      description: "Director de la institución educativa",
      permissions: ["*"]
    },
    {
      id: "docente",
      name: "Docente",
      description: "Profesor con acceso a cursos y calificaciones",
      permissions: ["educa:cursos:view", "educa:calificaciones:view", "educa:calificaciones:grade"]
    },
    {
      id: "estudiante",
      name: "Estudiante",
      description: "Alumno matriculado",
      permissions: ["educa:cursos:view", "educa:calificaciones:view"]
    },
    {
      id: "padres",
      name: "Apoderado",
      description: "Representante del estudiante",
      permissions: ["educa:calificaciones:view", "finanzas:pagos:view"]
    }
  ]
};

export const MODULE_DEFINITIONS = [];
