import express from "express";
import { resolveAuthContext } from "../supabase.js";
import { getBearerToken, sendError, sendUnexpectedError } from "../utils/http.js";

const router = express.Router();

async function resolveContext(req, res) {
  const accessToken = getBearerToken(req);
  if (!accessToken) {
    sendError(res, 401, "IAM-004", { error_type: "auth" });
    return null;
  }

  const authContext = await resolveAuthContext(accessToken);
  if (authContext.error || !authContext.user) {
    sendError(res, 401, "IAM-004", { error_type: "auth" });
    return null;
  }

  return {
    userId: authContext.user.id,
    profile: authContext.profile,
    userClient: authContext.userClient
  };
}

// GET /api/profile/preferences
router.get("/", async (req, res) => {
  const ctx = await resolveContext(req, res);
  if (!ctx) return;

  try {
    const { data, error } = await ctx.userClient
      .from("profiles")
      .select("avatar_url, preferences, full_name, email_verified")
      .eq("id", ctx.userId)
      .single();

    if (error) {
      return sendUnexpectedError(res, error);
    }

    res.status(200).json(data);
  } catch (err) {
    sendUnexpectedError(res, err);
  }
});

// POST /api/profile/preferences
router.post("/", async (req, res) => {
  const ctx = await resolveContext(req, res);
  if (!ctx) return;

  const { avatar_url, preferences } = req.body;

  try {
    const { data, error } = await ctx.userClient
      .from("profiles")
      .update({ avatar_url, preferences })
      .eq("id", ctx.userId)
      .select("avatar_url, preferences, full_name, email_verified")
      .single();

    if (error) {
      return sendUnexpectedError(res, error);
    }

    res.status(200).json(data);
  } catch (err) {
    sendUnexpectedError(res, err);
  }
});

export default router;
