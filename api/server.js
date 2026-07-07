// Entry point que Vercel envuelve como Serverless Function (Node.js runtime).
// Deliberadamente NO se llama "index.js": Vercel colapsa "api/index.js" a la
// ruta "/api", lo cual es ambiguo con nuestro rewrite explícito. Nombrarlo
// "server.js" fija la ruta desplegada en "/api/server" sin ambigüedad —
// ver el rewrite "/api/:path*" -> "/api/server" en vercel.json.
import app from "../server/index.js";

export default app;
