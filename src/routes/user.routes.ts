import express from "express";
import multer from "multer";
import {
  createUserHandler,
  editAvatarHandler,
  editProfileHandler,
  forgotPasswordHandler,
  getCurrentUserHandler,
  getOwnedPostsHandler,
  getPublicUserHandler,
  getSavedPostsHandler,
  resetPasswordHandler,
  verifyUserHandler,
} from "../controller/user.controller";
import requireUser from "../middleware/requireUser";
import validateResource from "../middleware/validateResource";
import {
  createUserSchema,
  editProfileSchema,
  forgotPasswordSchema,
  getOwnedPostsSchema,
  getPublicUserSchema,
  getSavedPostsSchema,
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
  validateResource(editProfileSchema),
  requireUser,
  editProfileHandler
);

// const upload = multer({ dest: "./public/data/uploads"})
const storage = multer.memoryStorage();
const upload = multer({ storage })
router.post(
  "/api/users/me/edit-profile/avatar",
  [requireUser,
  upload.single('avatar')], // to add the image to the database !!! "avatar" must be also the name in the form 
  editAvatarHandler
);

router.post(
  "/api/users/me/owned-posts",
  validateResource(getOwnedPostsSchema),
  requireUser, getOwnedPostsHandler
);

router.post(
  "/api/users/me/saved-posts",
  validateResource(getSavedPostsSchema),
  requireUser, getSavedPostsHandler
);

router.get(
  "/api/users/get-profile/:id",
  validateResource(getPublicUserSchema),
  requireUser, getPublicUserHandler
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
