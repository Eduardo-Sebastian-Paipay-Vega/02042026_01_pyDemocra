import { Router } from "express";

const router = Router();

// /api/gym/ping
router.get("/ping", (req, res) => {
  res.json({ status: "ok", vertical: "gym" });
});

export default router;
