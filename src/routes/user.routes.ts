import express from "express";
import {
  createUserHandler,
  editProfileHandler,
  forgotPasswordHandler,
  getCurrentUserHandler,
  resetPasswordHandler,
  verifyUserHandler,
} from "../controller/user.controller";
import requireUser from "../middleware/requireUser";
import validateResource from "../middleware/validateResource";
import {
  createUserSchema,
  editProfileSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyUserSchema,
} from "../schema/user.schema";

// creating the router
const router = express.Router();

// big idea -> first validate, then call method from controller
// controllers do not talk to database, services do

// create user + sends verification code
router.post(
  "/api/users/register",
  validateResource(createUserSchema),
  createUserHandler
);

// verify email address with code
router.post(
  "/api/users/verify/:id/:verificationCode",
  validateResource(verifyUserSchema),
  verifyUserHandler
);

// sends a verification code for resetting password
router.post(
  "/api/users/forgotpassword",
  validateResource(forgotPasswordSchema),
  forgotPasswordHandler
);

// verify password reset code
router.post(
  "/api/users/resetpassword/:id/:passwordResetCode",
  validateResource(resetPasswordSchema),
  resetPasswordHandler
);

// protects if user doesn't have a valid access token
router.get("/api/users/me", requireUser, getCurrentUserHandler);

// --- settings ---
router.post(
  "/api/users/me/edit-profile",
  validateResource(editProfileSchema), requireUser,
  editProfileHandler
);

// router.post(
//   "/api/users/me/change-avatar",
//   validateResource(changeAvatarSchema),
//   changeAvatarHandler
// );


// router.post(
//   "/api/users/me/change-password",
//   validateResource(changePasswordSchema), requireUser,
//   changePasswordHandler
// );

// router.post(
//   "/api/users/me/close-account",
//   validateResource(closeAccountSchema),
//   closeAccountHandler
// );


export default router;
