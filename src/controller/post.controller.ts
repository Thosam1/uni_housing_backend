import { Ref } from "@typegoose/typegoose";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { omit } from "lodash";
import { Types } from "mongoose";
import multer from "multer";
import { MAX_IMAGES_POST } from "../constants";
import { Post, postPrivateFields } from "../model/post.model";
import { userPrivateFields, User } from "../model/user.model";

import {
  createPostInput,
  deletePostInput,
  editImagesInput,
  editPostInput,
  getPostInput,
  saveUnsavePostInput,
} from "../schema/post.schema";

import {
  createPost,
  deletePostById,
  findPostById,
  getAllPosts,
} from "../service/post.service";
import { findUserById, findUserByRef } from "../service/user.service";
import log from "../utils/logger";

// for google, facebook, the logic should be here if implemented

export async function createPostHandler(
  req: Request<{}, {}, createPostInput>,
  res: Response
) {
  console.log("entering ... create post handler");
  const body = req.body;
  console.log(body);

  // we check access token corresponds to the user
  if (res.locals.user._id !== body.user) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .send("Hacking is punishable by law !");
  }

  try {
    const user = await findUserById(body.user);
    if (!user) {
      console.log("this user doesn't exist");
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .send("This user doesn't exist");
    }

    console.log("later");

    // currently, we allow duplicates, no need to really check if same description etc, ...
    const post = await createPost(body);

    // after that, we also need to add the reference of this post to the user
    user.ownedPosts.push(post._id);
    await user.save();

    // idea: we can add some email verification to add a post if we see a lot of traffic in the future
    return res.send({
      message: "Post successfully created !",
      post_id: post._id,
    });
  } catch (e: any) {
    if (e.code === 11000) {
      return res.status(StatusCodes.CONFLICT).send("Post already exists");
    }
    console.log(e);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(e);
  }
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/images");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });
export async function editImagesHandler(
  req: Request<editImagesInput>,
  res: Response
) {
  if (!req.file) {
    res.status(StatusCodes.BAD_REQUEST).send("No file uploaded !");
  } else {
    const post = await findPostById(req.params.id);
    if (!post) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .send("This post doesn't exist");
    }

    if (post.images.length >= MAX_IMAGES_POST) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .send(`Limit of ${MAX_IMAGES_POST} images reached !`);
    }

    // const pathToFileInDatabase: string = req.file.destination + '/' + req.file.filename;
    upload.single("image");

    // // then we set the new path for the avatar
    // user.avatar = pathToFileInDatabase;
    // await user.save();

    res.send("File uploaded successfully !");
  }
}

export async function editPostHandler(
  req: Request<{}, {}, editPostInput>,
  res: Response
) {
  const body = req.body;
  try {
    const user = await findUserById(body.user_id);
    if (!user) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .send("This user doesn't exist");
    }

    // we check access token corresponds to the user
    if (res.locals.user._id !== body.user_id) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .send("Hacking is punishable by law !");
    }

    // currently, we allow duplicates, no need to really check if same description etc, ...
    const post = await findPostById(body.post_id);
    if (!post) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .send("This post doesn't exist");
    }

    post.title = body.title;
    post.city = body.city;
    post.country = body.country;
    post.startDate = body.startDate;
    post.endDate = body.endDate;
    post.description = body.description;
    post.price = body.price;

    await post.save();

    return res.send("Post successfully updated !");
  } catch (e: any) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(e);
  }
}

export async function deletePostHandler(
  req: Request<{}, {}, deletePostInput>,
  res: Response
) {
  const body = req.body;
  try {
    const user = await findUserById(body.user_id);
    if (!user) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .send("This user doesn't exist");
    }

    // we check access token corresponds to the user
    if (res.locals.user._id !== body.user_id) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .send("Hacking is punishable by law !");
    }

    // currently, we allow duplicates, no need to really check if same description etc, ...
    const post = await findPostById(body.post_id);
    if (!post) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .send("This post doesn't exist");
    }

    // we must remove from current user owned posts
    user.ownedPosts = user.ownedPosts.filter((elt) => elt !== post) as [
      Ref<Post, Types.ObjectId | undefined>
    ];
    await user.save();

    // [deprecated]
    // we must delete post from saved posts for all users
    // appararently this can be done via a middleware https://stackoverflow.com/questions/11904159/automatically-remove-referencing-objects-on-deletion-in-mongodb
    // in the "pre" hook in post.model.ts

    // removing references to this post from all users that saved this post
    const usersThatSavedThisPost = await Promise.all(
      post.savedBy.map((id) => findUserByRef(id))
    );
    usersThatSavedThisPost.map(async (user) => {
      if (user) {
        // check if user was found
        user.savedPosts = user.savedPosts.filter(
          (postID) => postID !== post._id
        ) as [Ref<Post, Types.ObjectId | undefined>];
        await user.save();
      }
    });

    // we must delete the post from the database
    await deletePostById(body.post_id);

    return res.send("Post successfully updated !");
  } catch (e: any) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(e);
  }
}

// to save a post for a given user
export async function saveUnsavePostHandler(
  req: Request<saveUnsavePostInput>,
  res: Response
) {
  const user_id = res.locals.user._id;
  const post_id = req.params.id;

  const user = await findUserById(user_id);
  if (!user) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send("This user doesn't exist");
  }

  const post = await findPostById(post_id);
  if (!post) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send("This post doesn't exist");
  }

  console.log("HERE");
  try {
    // // // --- to reset everything ---
    // user.savedPosts = [];
    // post.savedBy = [];
    // await user.save();
    // await post.save();

    // after that, we also need to add the reference of this post to the user (if not already there)
    if (user.savedPosts.filter((elt) => post._id.equals(elt)).length === 0) {
      user.savedPosts.push(post._id);
      await user.save();
      // we also add the reference to the user to the postf so the delete can be efficient when deleting a post
      if (post.savedBy.filter((elt) => post._id.equals(elt)).length === 0) {
        post.savedBy.push(user._id);
        await post.save();
      }
      // idea: we can add some email verification to add a post if we see a lot of traffic in the future
      return res
        .status(StatusCodes.OK)
        .send({ saved: true, message: "Post successfully saved !" });
    } else {
      // we remove the reference of this post to the user
      user.savedPosts = user.savedPosts.filter((elt) => !post._id.equals(elt));
      await user.save();
      // we also remove the reference to the user to the post so the delete can be efficient when deleting a post
      post.savedBy = post.savedBy.filter((id) => !user._id.equals(id));
      await post.save();

      // idea: we can add some email verification to add a post if we see a lot of traffic in the future
      return res
        .status(StatusCodes.OK)
        .send({ saved: false, message: "Post successfully unsaved !" });
    }
  } catch (e: any) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(e);
  }
}

// to get public versions, what we show eg: on the Home page
export async function getPostHandler(
  req: Request<getPostInput>,
  res: Response
) {
  const params = req.params;
  console.log("Get post handler");

  const post = await findPostById(params.id);
  if (!post) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send("This post doesn't exist");
  }

  const user = await findUserByRef(post.user);
  if (!user) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send("This user doesn't exist");
  }

  let newPostJson = JSON.stringify(omit(post?.toJSON(), postPrivateFields));
  let newPost = JSON.parse(newPostJson);

  newPost["owner_firstName"] = user.firstName;
  newPost["owner_lastName"] = user.lastName;
  newPost["owner_avatar"] = user.avatar;

  const found = post?.savedBy.filter((elt) => elt === user._id).length === 1;
  newPost["saved"] = found;

  return res.status(StatusCodes.OK).send(newPost);
}

export async function getHomePostsHandler(req: Request, res: Response) {
  const allPosts = await getAllPosts();
  if (!allPosts) {
    return res.status(StatusCodes.OK).send("All posts sent to you");
  } else {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send("An error has occured");
  }
}

export async function getAllPostsHandler(req: Request, res: Response) {}
