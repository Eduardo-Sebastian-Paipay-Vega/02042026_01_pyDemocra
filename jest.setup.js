// server/index.js solo abre un puerto real si !process.env.VERCEL (guard ya
// existente para el deploy serverless en Vercel, ver server/index.js). Se
// reutiliza exactamente ese mismo guard aquí — sin esto, cada test file que
// importa `app` desde server/index.js dispararía un app.listen() real,
// dejando handles abiertos y arriesgando EADDRINUSE si ya hay un
// `npm run dev:api` corriendo en la misma máquina.
process.env.VERCEL = "1";
