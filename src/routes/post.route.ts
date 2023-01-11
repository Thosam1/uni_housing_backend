import express from "express";
import {
  createSessionHandler,
  refreshAccessTokenHandler,
} from "../controller/auth.controller";
import {
  createPostHandler,
  deletePostHandler,
  editPostHandler,
  getAllPostsHandler,
  getHomePostsHandler,
  getPostHandler,
  saveUnsavePostHandler,
} from "../controller/post.controller";
import requireUser from "../middleware/requireUser";
import validateResource from "../middleware/validateResource";
import { createSessionSchema } from "../schema/auth.schema";
import {
  createPostSchema,
  deletePostSchema,
  editPostSchema,
  getPostSchema,
  saveUnsavePostSchema,
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
  validateResource(deletePostSchema),
  requireUser,
  deletePostHandler
);

// save or unsave a Post
router.post(
  "/api/post/save-unsave",
  validateResource(saveUnsavePostSchema),
  requireUser,
  saveUnsavePostHandler
);

// getting a Post
router.get(
  "/api/post/get/:id",
  validateResource(getPostSchema),
  requireUser,
  getPostHandler
);

// getting all posts
router.get("/api/post/home", requireUser, getHomePostsHandler);

// getting all posts
router.get("/api/post/get/all", requireUser, getAllPostsHandler);

export default router;
