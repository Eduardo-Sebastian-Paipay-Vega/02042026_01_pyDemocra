# Entornos de Contenedores (Docker)

*Fuente de verdad: Repositorio completo*

### Estado Actual: No Utilizado

El proyecto obedece al paradigma arquitectónico de **Serverless / Backend-as-a-Service**. Por lo tanto:
*   No existen archivos `Dockerfile` o `docker-compose.yml` en la raíz (más allá de lo que Supabase CLI requiera internamente de forma transparente para su entorno local).
*   No se empaquetan imágenes ni se publican en registros (ECR, DockerHub).

Toda la infraestructura se aloja dinámicamente en Vercel (Front + Node.js) y Supabase Cloud (PostgreSQL + Deno Edge Functions).
