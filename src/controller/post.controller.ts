import { Ref } from "@typegoose/typegoose";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { omit } from "lodash";
import { Types } from "mongoose";
import { Post } from "../model/post.model";
import { privateFields } from "../model/user.model";

import {
  createPostInput,
  deletePostInput,
  editPostInput,
  getPostInput,
  savePostInput,
  unsavePostInput,
} from "../schema/post.schema";

import { createPost, deletePostById, findPostById } from "../service/post.service";
import {
  findUserByEmail,
  findUserById,
  findUserByRef,
} from "../service/user.service";

// for google, facebook, the logic should be here if implemented

export async function createPostHandler(
  req: Request<{}, {}, createPostInput>,
  res: Response
) {
  const body = req.body;
  try {
    const user = await findUserById(body.user);
    if (!user) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .send("This user doesn't exist");
    }

    // we check access token corresponds to the user
    if (res.locals.user._id !== body.user) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .send("Hacking is punishable by law !");
    }

    // currently, we allow duplicates, no need to really check if same description etc, ...
    const post = await createPost(body);

    // after that, we also need to add the reference of this post to the user
    user.ownedPosts.push(post._id);
    await user.save();

    // idea: we can add some email verification to add a post if we see a lot of traffic in the future
    return res.send("Post successfully created !");
  } catch (e: any) {
    if (e.code === 11000) {
      return res.status(StatusCodes.CONFLICT).send("Post already exists");
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(e);
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
    post.location = body.location;
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

      // we must delete post from saved posts for all users
      // appararently this can be done via a middleware https://stackoverflow.com/questions/11904159/automatically-remove-referencing-objects-on-deletion-in-mongodb

      // we must delete the post from the database
      await deletePostById(body.post_id);

      return res.send("Post successfully updated !");
    } catch (e: any) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(e);
    }
  }

// to save a post for a given user
export async function savePostHandler(
  req: Request<{}, {}, savePostInput>,
  res: Response
) {
  const body = req.body;
  // we check access token corresponds to the user
  if (res.locals.user._id !== body.user_id) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .send("Hacking is punishable by law !");
  }

  const user = await findUserById(body.user_id);
  if (!user) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send("This user doesn't exist");
  }

  const post = await findPostById(body.post_id);
  if (!post) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send("This post doesn't exist");
  }
  try {
    // after that, we also need to add the reference of this post to the user (if not already there)
    if (user.savedPosts.filter((elt) => elt !== post._id).length === 0) {
      user.savedPosts.push(post._id);
      await user.save();

      // idea: we can add some email verification to add a post if we see a lot of traffic in the future
      return res.status(StatusCodes.OK).send("Post successfully saved !");
    } else {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .send("This post has already been saved");
    }
  } catch (e: any) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(e);
  }
}

// to unsave a post for a given user
export async function unsavePostHandler(
  req: Request<{}, {}, unsavePostInput>,
  res: Response
) {
  const body = req.body;
  // we check access token corresponds to the user
  if (res.locals.user._id !== body.user_id) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .send("Hacking is punishable by law !");
  }

  const user = await findUserById(body.user_id);
  if (!user) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send("This user doesn't exist");
  }

  const post = await findPostById(body.post_id);
  if (!post) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send("This post doesn't exist");
  }
  try {
    // after that, we also need to add the reference of this post to the user
    user.savedPosts = user.savedPosts.filter((elt) => elt !== post) as [
      Ref<Post, Types.ObjectId | undefined>
    ];
    await user.save();

    // idea: we can add some email verification to add a post if we see a lot of traffic in the future
    return res.status(StatusCodes.OK).send("Post successfully unsaved !");
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

  const publicProfile = omit(user.toJSON(), privateFields);

  return res.status(StatusCodes.OK).send({ ownerProfile: publicProfile, post });
}

export async function getAllPostsHandler(req: Request, res: Response) {}
