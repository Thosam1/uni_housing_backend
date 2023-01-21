import { Ref } from "@typegoose/typegoose";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { omit } from "lodash";
import { Types } from "mongoose";
import multer from "multer";
import { MAX_IMAGES_POST } from "../constants";
import { Post, postPreview, postPrivateFields } from "../model/post.model";
import { userPrivateFields, User } from "../model/user.model";
import fs from "fs";

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

    const pathToFileInDatabase: string = req.file.destination + '/' + req.file.filename;
    console.log(pathToFileInDatabase)
    console.log(req.file)

    if (post.images.length >= MAX_IMAGES_POST) {

      // we must delete the image added to the database

      fs.unlink(pathToFileInDatabase, (err) => {
        log.info(`error has happened deleting file at path (becuase max nb of images exceeded) : ${pathToFileInDatabase}`);
        log.info(err);
        // // // idea could add this to a list of all files that didn't got deleted to be retried every end of week todo
      });

      return res
        .status(StatusCodes.BAD_REQUEST)
        .send(`Limit of ${MAX_IMAGES_POST} images reached !`);
    }

    post.images.push(pathToFileInDatabase);
    await post.save();

    res.send("File uploaded successfully !");
  }
}

export async function editPostHandler(
  req: Request<editPostInput["params"], {}, editPostInput["body"]>,
  res: Response
) {
  const post_id = req.params.id;
  const body = req.body;
  const user_id = res.locals.user._id;
  try {
    const user = await findUserById(user_id);
    if (!user) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .send("This user doesn't exist");
    }

    // currently, we allow duplicates, no need to really check if same description etc, ...
    const post = await findPostById(post_id);
    if (!post) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .send("This post doesn't exist");
    }

    // todo - form validation ? or maybe in the schema

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
  req: Request<deletePostInput>,
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

  try {
    // currently, we allow duplicates, no need to really check if same description etc, ...
    const post = await findPostById(post_id);
    if (!post) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .send("This post doesn't exist");
    }

    if(user_id !== post.user?.toString()) {
      return res.status(StatusCodes.UNAVAILABLE_FOR_LEGAL_REASONS).send("Yo, hacking is punishable by law !");
    }

    // we must remove from current user owned posts
    user.ownedPosts = user.ownedPosts.filter((elt) => !post._id.equals(elt));
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
        user.savedPosts = user.savedPosts.filter((postID) => !post._id.equals(postID));
        await user.save();
      }
    });

    // we must delete the post from the database
    await deletePostById(post_id);

    return res.status(StatusCodes.OK).send("Post successfully updated !");
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

  const found =
    post?.savedBy.filter((elt) => user._id.equals(elt)).length === 1;
  newPost["saved"] = found;

  return res.status(StatusCodes.OK).send(newPost);
}

export async function getHomePostsHandler(req: Request, res: Response) {
  const allPosts = await getAllPosts();
  const omitted = allPosts.map((post) => omit(post?.toJSON(), postPreview));

  if (allPosts) {
    return res.status(StatusCodes.OK).send(omitted);
  } else {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send("An error has occured");
  }
}

export async function getAllPostsHandler(req: Request, res: Response) {}
