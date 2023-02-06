import express from "express";
import multer from "multer";
import {
  createPostHandler,
  deletePostHandler,
  editImagesHandler,
  editPostHandler,
  getAllPostsHandler,
  getHomePostsHandler,
  getPostHandler,
  saveUnsavePostHandler,
} from "../controller/post.controller";
import requireUser from "../middleware/requireUser";
import validateResource from "../middleware/validateResource";
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

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/images");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });
router.post(
  "/api/post/edit-images/:id",
  requireUser,
  upload.single('image'),
  editImagesHandler
);

// edit a Post
router.post(
  "/api/post/edit/:id",
  validateResource(editPostSchema),
  requireUser,
  editPostHandler
);

// delete a Post
router.delete(
  "/api/post/delete/:id",
  validateResource(deletePostSchema),
  requireUser,
  deletePostHandler
);

// save or unsave a Post
router.get(
  "/api/post/save-unsave/:id",
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
