# Commit y push (ejecutar en tu terminal, en la raíz del repo)

La auditoría no modifica lógica, base de datos ni dependencias: solo añade archivos nuevos en
`docs/mobile/`, `mobile/` y `changes/`. Verificación previa recomendada:

```bash
npm run typecheck   # debe seguir en verde (mobile/ y docs/ no entran en tsc/vite)
git status          # confirmar que solo hay archivos nuevos
```

Commit (Conventional Commits) y push a origin/main:

```bash
git add docs/mobile mobile changes/2026-07-04_auditoria-movil-react-native
git commit -m "docs(mobile): auditoria integral para migracion a React Native y scaffolding /mobile

- 11 documentos de auditoria en docs/mobile (arquitectura, RF, reutilizacion, offline, DB, riesgos, roadmap)
- estructura inicial mobile/ (Expo Router app/ + src/** con 14 subcarpetas), sin implementacion
- sin cambios en el proyecto web, base de datos ni dependencias"
git push origin main
```
