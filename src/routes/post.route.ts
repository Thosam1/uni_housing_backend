import express from "express";
import {
  createSessionHandler,
  refreshAccessTokenHandler,
} from "../controller/auth.controller";
import {
  createPostHandler,
  editPostHandler,
  getAllPostsHandler,
  getPostHandler,
  savePostHandler,
  unsavePostHandler,
} from "../controller/post.controller";
import requireUser from "../middleware/requireUser";
import validateResource from "../middleware/validateResource";
import { createSessionSchema } from "../schema/auth.schema";
import {
  createPostSchema,
  editPostSchema,
  getPostSchema,
  savePostSchema,
  unsavePostSchema,
} from "../schema/post.schema";

const router = express.Router();

// creating a Post
router.post(
  "/api/post/create",
  validateResource(createPostSchema),
  requireUser,
  createPostHandler
);

// edit a Post
router.post(
  "/api/post/edit",
  validateResource(editPostSchema),
  requireUser,
  editPostHandler
);

// delete a Post
router.delete(
  "/api/post/delete",
  validateResource(editPostSchema),
  requireUser,
  editPostHandler
);

// save a Post
router.post(
  "/api/post/save",
  validateResource(savePostSchema),
  requireUser,
  savePostHandler
);

// unsave a Post
router.post(
  "/api/post/unsave",
  validateResource(unsavePostSchema),
  requireUser,
  unsavePostHandler
);

// getting a Post
router.get(
  "/api/post/get/:id",
  validateResource(getPostSchema),
  requireUser,
  getPostHandler
);

// getting all posts
router.get("/api/post/get/all", requireUser, getAllPostsHandler);

export default router;
