# EDUCACION OS — Architecture Change Log
# cambios/09082026_ArchitecturaRBACDomainDriven.md

## Fecha: 2026-08-09
## Tipo: ARCHITECTURAL OVERHAUL — Dynamic RBAC + Domain-Driven Modularization

---

## Resumen Ejecutivo

Se refactorizó completamente la arquitectura frontend de `apps/web` de un modelo
**role-centric** a un modelo **domain-driven con RBAC dinámico**.

**Principio central implementado:**
> ROLES CONTROLAN ACCESO A MÓDULOS. ROLES NO DEFINEN DÓNDE VIVEN LOS MÓDULOS.

---

## Archivos Creados

### RBAC Layer (`src/lib/rbac/`)
- `permissions.ts` — Taxonomía completa de permisos tipados (~120 permisos)
- `roles.ts` — Mapeo Role → Permission (fuente de verdad, sin código en features)
- `service.ts` — API de capacidades: `hasPermission`, `canAccessModule`, `buildSession`
- `index.ts` — Barrel export

### Auth Layer (`src/context/`)
- `AuthContext.tsx` — Reemplaza string `role` crudo con `UserSession + can() + canModule()`

### Module Registry (`src/lib/modules/`)
- `registry.ts` — 70+ módulos registrados con `{ id, label, permission, domain }`

### App Router (`src/`)
- `AppRouter.tsx` — Router domain-driven con lazy loading, AccessDenied, 404 handler

---

## Archivos Modificados

- `src/App.tsx` — Reescrito: sin switches de roles, usa AuthContext + AppRouter
- `src/main.tsx` — Añadido `<AuthProvider>` wrapper
- `src/components/layout/Sidebar.tsx` — Reescrito: permission-driven navigation

---

## Nueva Estructura de Dominios

```
features/
├── educa/              ← Academico: cursos, items, evaluaciones, gamificación, IA ed.
│   ├── CurriculumBuilder.tsx
│   ├── BancoItemesLLM.tsx
│   ├── EngineCATIRT.tsx
│   ├── ProctoringIA.tsx
│   ├── PeerReviewCiego.tsx
│   ├── EvaluacionPsicotecnica.tsx
│   ├── DynamicPathingMap.tsx
│   ├── DigitalTwinView.tsx
│   ├── CognitiveLoadSensor.tsx
│   ├── LeaderboardXP.tsx
│   ├── BadgesGallery.tsx
│   ├── MisionesRetos.tsx
│   ├── Lab3DWebGL.tsx
│   ├── VideoPlayerHLS.tsx
│   ├── PDFViewer.tsx
│   ├── ResourceRepository.tsx
│   └── AsistenciaQR.tsx
│
├── finanzas/
│   └── components/
│       ├── DashboardCFO.tsx
│       ├── TokenEconomyDashboard.tsx
│       └── PasarelaPagos.tsx
│
├── ews/
│   └── components/
│       ├── EWSDetailView.tsx
│       └── BehavioralAnalytics.tsx
│
├── comunicacion/
│   ├── ChatAcademico.tsx
│   ├── CentroAvisos.tsx
│   ├── RedSocialSegura.tsx
│   └── ParentLiveStream.tsx
│
├── institution/
│   └── components/
│       ├── GestorEspacios.tsx
│       ├── HorariosGeneticos.tsx
│       ├── NominaInteligente.tsx
│       ├── MantenimientoPredictivo.tsx
│       ├── ScoringBecasIA.tsx
│       ├── ProtocolosCrisis.tsx
│       ├── ObservatorioClima.tsx
│       ├── CentroPrivacidadGDPR.tsx
│       └── SincronizacionERP.tsx
│
├── ia/
│   └── components/
│       ├── AgenticSwarmOrchestrator.tsx
│       ├── KnowledgeGraphView.tsx
│       ├── FederatedLearningConfig.tsx
│       └── EcosistemaPlugins.tsx
│
├── bienestar/
│   └── components/
│       ├── TriageSaludMental.tsx
│       ├── SensorBullying.tsx
│       ├── ClanesP2P.tsx
│       ├── ClubesInstitucionales.tsx
│       ├── PlanInclusionPIE.tsx
│       ├── AprendizajeServicio.tsx
│       └── P2PMarketplace.tsx
│
└── identidad/
    └── components/
        ├── SovereignIdentityWallet.tsx
        └── B2BTalentMarketplace.tsx
```

## Directorios Legacy (mantenidos como referencia - NO eliminar aún)
Los siguientes directorios siguen existiendo como fuente de los dashboards
"role-flavored" que aún se usan para las vistas de resumen del rol:

- `features/director/DashboardDirector.tsx` — Dashboard hub del director
- `features/docente/DashboardDocente.tsx` — Dashboard hub del docente
- `features/coordinador/DashboardCoordinador.tsx`
- `features/padres/DashboardPadres.tsx`
- `features/estudiante/DashboardEstudiante.tsx`

> Estos son solo dashboards de resumen UX, no arquitectura de permisos.

---

## Invariantes Implementados

1. ✅ Un nuevo rol NO requiere crear un nuevo directorio de features
2. ✅ Un módulo puede ser usado por múltiples roles sin duplicar el módulo
3. ✅ Los permisos pueden cambiar sin mover archivos
4. ✅ Las rutas representan capacidades del producto, no identidades de usuario
5. ✅ El modelo de permisos frontend es reemplazable por una fuente backend real
6. ✅ Los módulos frontend no dependen de directorios específicos de roles

---

## Validación

- Build: ✅ EXITOSA (2888 módulos transformados, 0 errores)
- TypeScript: ✅ Sin errores críticos
- Imports rotos: ✅ 0 (todos normalizados a `@/lib/`)
