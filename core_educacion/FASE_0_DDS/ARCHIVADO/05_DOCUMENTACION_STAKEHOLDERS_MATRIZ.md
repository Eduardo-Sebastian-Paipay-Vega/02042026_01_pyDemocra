# FASE 0 — Metodología DDS: Etapa 5 — Matriz Maestra de Trazabilidad EDUCACION OS (42 RFs)

> **Proyecto**: EDUCACION OS — Sistema Operativo de Gestión e Infraestructura Educativa Inteligente
> **Fase**: Fase 0 — Metodología DDS (Desarrollo Dirigido por Sistemas)
> **Etapa**: Etapa 5 — Stakeholders & Matriz Maestra de Trazabilidad (42 RFs)
> **Versión**: 4.0 (TRAZABILIDAD 1:1 RE-ALINEADA Y CERTIFICADA)
> **Fecha**: 2026-08-01
> **Autor**: Eduardo Sebastian Paipay Vega

---

## 📊 1. Matriz de Stakeholders & Roles

```
Stakeholder → RFs Asociados → Casos de Uso (CU) → Permisos → Procesos del Negocio
```

| Stakeholder / Actor | RFs Asociados | Casos de Uso (CU) | Permisos Requeridos | Proceso de Negocio Integrado |
|---------------------|---------------|-------------------|---------------------|------------------------------|
| **`STUDENT_USER`** | `RF-002`, `RF-003`, `RF-004`, `RF-005`, `RF-006`, `RF-007`, `RF-022`, `RF-025`, `RF-026`, `RF-028`, `RF-033`, `RF-038`, `RF-040` | `CU-002` a `CU-007`, `CU-022`, `CU-025`, `CU-026`, `CU-028`, `CU-033`, `CU-038`, `CU-040` | `learning:adaptive`, `content:view`, `assignment:submit`, `gamification:earn`, `leaderboard:view`, `dtl:simulate`, `did:manage` | Aprendizaje Adaptativo, Visualización HLS, Badges XP, Leaderboard, Retos, Gemelo Digital DTL y Credenciales DID |
| **`TEACHER_USER`** | `RF-001`, `RF-004`, `RF-011`, `RF-023`, `RF-024` | `CU-001`, `CU-004`, `CU-011`, `CU-023`, `CU-024` | `course:create`, `assignment:grade`, `chat:send`, `content:generate`, `feedback:record` | Creador Curricular Modular, Calificación por Rúbricas, Copiloto Docente IA y Feedback de Voz/Video |
| **`PARENT_USER`** | `RF-008`, `RF-015`, `RF-017`, `RF-029`, `RF-031`, `RF-032` | `CU-008`, `CU-015`, `CU-017`, `CU-029`, `CU-031`, `CU-032` | `payments:checkout`, `dashboard:view_360`, `documents:sign`, `market:purchase`, `parent:view_feed`, `appointments:book` | Pasarela de Pagos, Dashboard 360°, Firma Digital Docusign, Parent Live Stream y Citas con Docentes |
| **`ACADEMIC_ADMIN`**| `RF-001`, `RF-014`, `RF-016`, `RF-019`, `RF-027`, `RF-035` | `CU-001`, `CU-014`, `CU-016`, `CU-019`, `CU-027`, `CU-035` | `course:publish`, `reports:generate`, `ews:view_alerts`, `data:export`, `credentials:issue`, `analytics:cohorts` | Gestión de Mallas, Actas 1-Click, Alertas EWS de Deserción, Micro-credenciales y Analítica de Cohortes |
| **`FINANCE_ADMIN`** | `RF-008`, `RF-009`, `RF-018`, `RF-037` | `CU-008`, `CU-009`, `CU-018`, `CU-037` | `payments:checkout`, `invoices:issue`, `integration:manage_erp`, `finance:view_cost` | Gestión de Pensiones, Facturación Electrónica, Sincronización ERP Contable y Costo Unitario por Alumno |
| **`DIRECTOR_USER`** | `RF-013`, `RF-027`, `RF-030`, `RF-039` | `CU-013`, `CU-027`, `CU-030`, `CU-039` | `announcement:broadcast`, `credentials:issue`, `donations:pledge`, `governance:vote` | Circulares Institucionales, Micro-credenciales, Crowdfunding y Asamblea Digital de Gobernanza |
| **`TUTOR_USER`** | `RF-016`, `RF-021` | `CU-016`, `CU-021` | `ews:view_alerts`, `ews:intervene` | Seguimiento de Alertas EWS y Registro de Intervenciones Tutoriles |
| **`SUPER_ADMIN`** | `RF-001` a `RF-042` | `CU-001` a `CU-042` | `*` (Control Maestro Global) | Gobernanza Global Multi-Tenant del Sistema Operativo EDUCACION OS |

---

## 🔗 2. Matriz de Trazabilidad Extremo a Extremo (RF ↔ CU ↔ UX ↔ API ↔ BD)

$$\text{RF} \longrightarrow \text{CU} \longrightarrow \text{Pantalla UX} \longrightarrow \text{Endpoint API NestJS} \longrightarrow \text{Entidad DDD} \longrightarrow \text{Tabla BD PostgreSQL}$$

| RF ID | Caso de Uso (CU) | Pantalla UX (Fase 6) | Endpoint API NestJS (Fase 7) | Entidad DDD (Fase 0) | Tabla PostgreSQL (Fase 5) | Estado |
|-------|-------------------|----------------------|------------------------------|----------------------|---------------------------|--------|
| `RF-001` | `CU-001` | `SCR-001` (Creador Curricular) | `POST /api/v1/courses` | `Course` | `courses` | 🟢 COMPLETA |
| `RF-002` | `CU-002` | `SCR-002` (Ruta Adaptativa) | `POST /api/v1/adaptive/next` | `AdaptivePath` | `adaptive_paths` | 🟢 COMPLETA |
| `RF-003` | `CU-003` | `SCR-003` (Reproductor HLS) | `GET /api/v1/lessons/:id/stream` | `LessonMedia` | `lesson_media` | 🟢 COMPLETA |
| `RF-004` | `CU-004` | `SCR-004` (Entrega Tareas) | `POST /api/v1/assignments/submit` | `Submission` | `submissions` | 🟢 COMPLETA |
| `RF-005` | `CU-005` | `SCR-005` (Badges Hitos) | `GET /api/v1/badges/earned` | `Badge` | `user_badges` | 🟢 COMPLETA |
| `RF-006` | `CU-006` | `SCR-006` (Leaderboard XP) | `GET /api/v1/leaderboard` | `Leaderboard` | `xp_rankings` | 🟢 COMPLETA |
| `RF-007` | `CU-007` | `SCR-007` (Misiones Retos) | `POST /api/v1/quests/claim` | `Quest` | `quests` | 🟢 COMPLETA |
| `RF-008` | `CU-008` | `SCR-008` (Pagos Pasarela) | `POST /api/v1/payments/checkout` | `Payment` | `tuition_payments` | 🟢 COMPLETA |
| `RF-009` | `CU-009` | `SCR-009` (Recibos Digitales) | `GET /api/v1/invoices/:id/pdf` | `Invoice` | `invoices` | 🟢 COMPLETA |
| `RF-010` | `CU-010` | `SCR-010` (Recordatorios Mora)| `POST /api/v1/reminders/send` | `Reminder` | `payment_reminders` | 🟢 COMPLETA |
| `RF-011` | `CU-011` | `SCR-011` (Chat Académico) | `WSS /ws/v1/chat` | `ChatMessage` | `chat_messages` | 🟢 COMPLETA |
| `RF-012` | `CU-012` | `SCR-012` (Avisos Context) | `GET /api/v1/notifications` | `Notification` | `notifications` | 🟢 COMPLETA |
| `RF-013` | `CU-013` | `SCR-013` (Circulares PDF) | `POST /api/v1/announcements` | `Announcement` | `announcements` | 🟢 COMPLETA |
| `RF-014` | `CU-014` | `SCR-014` (Actas 1-Click) | `POST /api/v1/reports/grade-cards` | `GradeReport` | `grade_reports` | 🟢 COMPLETA |
| `RF-015` | `CU-015` | `SCR-015` (Dashboard 360) | `GET /api/v1/students/:id/360` | `StudentProfile` | `student_profiles` | 🟢 COMPLETA |
| `RF-016` | `CU-016` | `SCR-016` (EWS Deserción) | `GET /api/v1/ews/risk-alerts` | `EwsAlert` | `ews_risk_alerts` | 🟢 COMPLETA |
| `RF-017` | `CU-017` | `SCR-017` (Firma DocuSign) | `POST /api/v1/contracts/sign` | `Contract` | `digital_contracts` | 🟢 COMPLETA |
| `RF-018` | `CU-018` | `SCR-018` (Sincro ERP) | `POST /api/v1/integrations/erp/sync`| `ErpSync` | `erp_sync_logs` | 🟢 COMPLETA |
| `RF-019` | `CU-019` | `SCR-019` (Exportador Data) | `POST /api/v1/data/export` | `DataExport` | `export_audit_logs` | 🟢 COMPLETA |
| `RF-020` | `CU-020` | `SCR-020` (GDPR/FERPA) | `POST /api/v1/privacy/consent` | `PrivacyConsent`| `gdpr_consents` | 🟢 COMPLETA |
| `RF-021` | `CU-021` | `SCR-021` (Early Intervention)| `POST /api/v1/ews/intervene` | `EwsIntervention`| `ews_interventions` | 🟢 COMPLETA |
| `RF-022` | `CU-022` | `SCR-022` (Tutores Virtuales) | `POST /api/v1/tutors/ai-ask` | `AiTutorSession` | `ai_tutor_sessions` | 🟢 COMPLETA |
| `RF-023` | `CU-023` | `SCR-023` (Generador Quizzes) | `POST /api/v1/quizzes/generate`| `AiQuiz` | `ai_quizzes` | 🟢 COMPLETA |
| `RF-024` | `CU-024` | `SCR-024` (Feedback Voz/Video) | `POST /api/v1/feedback/media` | `MediaFeedback` | `media_feedbacks` | 🟢 COMPLETA |
| `RF-025` | `CU-025` | `SCR-025` (Pares Co-eval) | `POST /api/v1/peer-review/assign`| `PeerReview` | `peer_reviews` | 🟢 COMPLETA |
| `RF-026` | `CU-026` | `SCR-026` (Portafolios Evid)| `POST /api/v1/portfolio/items` | `PortfolioItem` | `portfolio_items` | 🟢 COMPLETA |
| `RF-027` | `CU-027` | `SCR-027` (Micro-credenciales)| `POST /api/v1/credentials/issue`| `MicroCredential`| `micro_credentials` | 🟢 COMPLETA |
| `RF-028` | `CU-028` | `SCR-028` (Becas Dinámicas) | `GET /api/v1/scholarships/eligible`| `Scholarship` | `scholarships` | 🟢 COMPLETA |
| `RF-029` | `CU-029` | `SCR-029` (Marketplace Ed) | `GET /api/v1/marketplace/items` | `MarketItem` | `marketplace_items` | 🟢 COMPLETA |
| `RF-030` | `CU-030` | `SCR-030` (Donaciones CROWD)| `POST /api/v1/crowdfunding/pledge`| `CrowdPledge` | `crowd_pledges` | 🟢 COMPLETA |
| `RF-031` | `CU-031` | `SCR-031` (Parent Live Stream)| `GET /api/v1/parent/feed` | `ParentFeedCard` | `parent_feed_cards` | 🟢 COMPLETA |
| `RF-032` | `CU-032` | `SCR-032` (Citas Docente-Padre)| `POST /api/v1/appointments/book`| `Appointment` | `parent_appointments` | 🟢 COMPLETA |
| `RF-033` | `CU-033` | `SCR-033` (Foros Comunidad) | `POST /api/v1/community/posts` | `ForumPost` | `forum_posts` | 🟢 COMPLETA |
| `RF-034` | `CU-034` | `SCR-034` (Red Alumni) | `GET /api/v1/alumni/directory` | `AlumniProfile` | `alumni_profiles` | 🟢 COMPLETA |
| `RF-035` | `CU-035` | `SCR-035` (Predictor Cohortes)| `GET /api/v1/analytics/cohorts`| `CohortAnalytics` | `cohort_analytics` | 🟢 COMPLETA |
| `RF-036` | `CU-036` | `SCR-036` (Optimiza Aulas) | `POST /api/v1/schedules/optimize`| `ClassSchedule` | `class_schedules` | 🟢 COMPLETA |
| `RF-037` | `CU-037` | `SCR-037` (Costos por Alumno) | `GET /api/v1/finance/unit-cost`| `UnitCost` | `unit_costs` | 🟢 COMPLETA |
| `RF-038` | `CU-038` | `SCR-038` (Gemelo Digital DTL)| `GET /api/v1/dtl/simulate` | `DigitalTwin` | `student_digital_twins` | 🟢 COMPLETA |
| `RF-039` | `CU-039` | `SCR-039` (Asistente Asamb) | `POST /api/v1/governance/vote` | `GovernanceVote` | `governance_votes` | 🟢 COMPLETA |
| `RF-040` | `CU-040` | `SCR-040` (Credencial SSI) | `POST /api/v1/did/issue` | `SovereignDid` | `sovereign_dids` | 🟢 COMPLETA |
| `RF-041` | `CU-041` | `SCR-041` (Zero Knowledge) | `POST /api/v1/zkp/verify` | `ZkpProof` | `zkp_proofs` | 🟢 COMPLETA |
| `RF-042` | `CU-042` | `SCR-042` (Audit Inmutable) | `GET /api/v1/audit/blockchain`| `AuditLogItem` | `blockchain_audit_logs` | 🟢 COMPLETA |
| `RF-043` | `CU-043` | `SCR-043` (Canvas 3D WebGL) | `POST /api/v1/labs/simulate` | `VirtualLab` | `virtual_lab_simulations` | 🟢 COMPLETA |
| `RF-044` | `CU-044` | `SCR-044` (Asistencia QR Dinám)| `POST /api/v1/attendance/qr-verify`| `AttendanceQr` | `attendance_dynamic_qrs` | 🟢 COMPLETA |
| `RF-045` | `CU-045` | `SCR-045` (Hub de Clanes P2P) | `POST /api/v1/clans/join` | `StudentClan` | `student_clans` | 🟢 COMPLETA |
| `RF-046` | `CU-046` | `SCR-046` (Gestor Espacios) | `POST /api/v1/facilities/reserve` | `FacilityReservation` | `facility_reservations` | 🟢 COMPLETA |
| `RF-047` | `CU-047` | `SCR-047` (Checkout QR Local) | `POST /api/v1/payments/local-qr` | `LocalPayment` | `local_payment_transactions` | 🟢 COMPLETA |
| `RF-048` | `CU-048` | `SCR-048` (Convalidación NLP)| `POST /api/v1/curriculum/convalidate`| `Convalidation` | `curriculum_convalidations` | 🟢 COMPLETA |
| `RF-049` | `CU-049` | `SCR-049` (Accesibilidad UI) | `GET /api/v1/accessibility/profile`| `AccessProfile` | `accessibility_user_profiles` | 🟢 COMPLETA |
| `RF-050` | `CU-050` | `SCR-050` (Transparencia Pub) | `GET /api/v1/transparency/report` | `PublicAudit` | `public_audit_reports` | 🟢 COMPLETA |
| `RF-051` | `CU-051` | `SCR-051` (Engine CAT/IRT) | `POST /api/v1/assessments/cat-irt` | `CatAssessment` | `cat_irt_assessments` | 🟢 COMPLETA |
| `RF-052` | `CU-052` | `SCR-052` (Proctoring IA) | `POST /api/v1/proctoring/verify` | `ProctoringSession` | `proctoring_ai_sessions` | 🟢 COMPLETA |
| `RF-053` | `CU-053` | `SCR-053` (Peer-Review Ciego) | `POST /api/v1/peer-review/evaluate` | `PeerAssignment` | `peer_review_assignments` | 🟢 COMPLETA |
| `RF-054` | `CU-054` | `SCR-054` (Banco Ítemes LLM) | `POST /api/v1/item-bank/synthesize` | `ItemQuestion` | `item_bank_questions` | 🟢 COMPLETA |
| `RF-055` | `CU-055` | `SCR-055` (Psico-Aptitudinal) | `POST /api/v1/psycho/assess` | `PsychoReport` | `psycho_aptitude_reports` | 🟢 COMPLETA |
| `RF-056` | `CU-056` | `SCR-056` (Nómina Docente) | `POST /api/v1/hr/payroll/calculate` | `FacultyPayroll` | `faculty_lifecycle_payroll` | 🟢 COMPLETA |
| `RF-057` | `CU-057` | `SCR-057` (Horarios Genéticos)| `POST /api/v1/schedules/optimize-genetic`| `ScheduleOptimization`| `schedule_genetic_optimizations`| 🟢 COMPLETA |
| `RF-058` | `CU-058` | `SCR-058` (Actas Gobernanza) | `POST /api/v1/governance/board/resolution`| `BoardResolution` | `board_governance_resolutions` | 🟢 COMPLETA |
| `RF-059` | `CU-059` | `SCR-059` (Mantenimiento TI) | `POST /api/v1/assets/maintenance-predict`| `AssetMaintenance` | `asset_predictive_maintenances` | 🟢 COMPLETA |
| `RF-060` | `CU-060` | `SCR-060` (Scoring Becas) | `POST /api/v1/scholarships/adjudicate`| `ScholarshipAid` | `scholarship_financial_aids` | 🟢 COMPLETA |
| `RF-061` | `CU-061` | `SCR-061` (Respuesta Crisis) | `POST /api/v1/emergency/trigger` | `EmergencyCrisis` | `emergency_crisis_events` | 🟢 COMPLETA |
| `RF-062` | `CU-062` | `SCR-062` (Audit Trail Inmut)| `GET /api/v1/audit/immutable-trail` | `AuditLog` | `audit_trail_immutable_logs` | 🟢 COMPLETA |
| `RF-063` | `CU-063` | `SCR-063` (Radar Salud Mental)| `POST /api/v1/mental-health/triage` | `MentalAlert` | `mental_health_radar_alerts` | 🟢 COMPLETA |
| `RF-064` | `CU-064` | `SCR-064` (Red Social Segura)| `POST /api/v1/community/safe-post` | `SocialPost` | `safe_social_mediations` | 🟢 COMPLETA |
| `RF-065` | `CU-065` | `SCR-065` (Planes IEP / PIE) | `POST /api/v1/inclusion/iep-plan` | `IepPlan` | `inclusion_iep_plans` | 🟢 COMPLETA |
| `RF-066` | `CU-066` | `SCR-066` (Observatorio Clima)| `GET /api/v1/climate/sentiment-map` | `ClimateSurvey` | `climate_sentiment_surveys` | 🟢 COMPLETA |
| `RF-067` | `CU-067` | `SCR-067` (Lifelong Alumni) | `GET /api/v1/alumni/lifelong-hub` | `AlumniEntry` | `alumni_lifelong_directory` | 🟢 COMPLETA |
| `RF-068` | `CU-068` | `SCR-068` (Dashboard ESG) | `GET /api/v1/esg/impact-dashboard` | `EsgMetric` | `esg_impact_dashboards` | 🟢 COMPLETA |
| `RF-069` | `CU-069` | `SCR-069` (Aprendizaje-Serv) | `POST /api/v1/aps/service-projects` | `ServiceProject` | `service_learning_projects` | 🟢 COMPLETA |
| `RF-070` | `CU-070` | `SCR-070` (Clubes Estudiant) | `POST /api/v1/student-life/clubs` | `StudentClub` | `co_curricular_student_clubs` | 🟢 COMPLETA |

---

*Fin de la Matriz Maestra de Trazabilidad 1:1 EDUCACION OS (70 RFs) v6.0.*


