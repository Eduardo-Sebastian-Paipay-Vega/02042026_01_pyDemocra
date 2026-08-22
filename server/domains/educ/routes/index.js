import express from "express";
import profesoresRouter from "./profesores.js";
import estudiantesRouter from "./estudiantes.js";
import cursosRouter from "./cursos.js";
import analyticsRouter from "./analytics.js";

const router = express.Router();

router.use("/profesores", profesoresRouter);
router.use("/estudiantes", estudiantesRouter);
router.use("/cursos", cursosRouter);
router.use("/analytics", analyticsRouter);

export default router;
