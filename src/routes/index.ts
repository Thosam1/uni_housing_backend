import express from "express";
import user from "./user.routes";
import auth from "./auth.routes";

const router = express.Router();

// open terminal and type: curl http://localhost:3000/healthcheck
router.get("/healthcheck", (_, res) => res.status(200).send("The health check is okay !"));

// all our routes
router.use(user);
router.use(auth);

export default router;
