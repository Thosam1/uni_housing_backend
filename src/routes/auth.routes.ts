import express from "express";
import {
  createSessionHandler,
  refreshAccessTokenHandler,
} from "../controller/auth.controller";
import validateResource from "../middleware/validateResource";
import { createSessionSchema } from "../schema/auth.schema";

const router = express.Router();

// creating a session
router.post(
  "/api/sessions",
  validateResource(createSessionSchema),
  createSessionHandler
);

// refreshing the session
router.post("/api/sessions/refresh", refreshAccessTokenHandler);

export default router;
