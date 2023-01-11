import { Ref } from "@typegoose/typegoose";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { omit } from "lodash";
import { Types } from "mongoose";
import { Post } from "../model/post.model";
import { userPrivateFields, User } from "../model/user.model";

import {
  createPostInput,
  deletePostInput,
  editPostInput,
  getPostInput,
  saveUnsavePostInput,
} from "../schema/post.schema";

import {
  createPost,
  deletePostById,
  findPostById,
} from "../service/post.service";
import {
  findUserById,
  findUserByRef,
} from "../service/user.service";
import log from "../utils/logger";

// for google, facebook, the logic should be here if implemented

export async function createPostHandler(
  req: Request<{}, {}, createPostInput>,
  res: Response
) {
  log.info("IN HERE")
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
  req: Request<{}, {}, saveUnsavePostInput>,
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

      // we also add the reference to the user to the postf so the delete can be efficient when deleting a post
      if (!post.savedBy.includes(user)) {
        post.savedBy.push(user);
        await post.save();
      }

      // idea: we can add some email verification to add a post if we see a lot of traffic in the future
      return res.status(StatusCodes.OK).send({ saved: true, message: "Post successfully saved !" });
    } else {
      // we remove the reference of this post to the user
      user.savedPosts = user.savedPosts.filter((elt) => elt !== post) as [
        Ref<Post, Types.ObjectId | undefined>
      ];
      await user.save();

      // we also remove the reference to the user to the post so the delete can be efficient when deleting a post
      if (post.savedBy.includes(user)) {
        post.savedBy = post.savedBy.filter((id) => id !== user) as [
          Ref<User, Types.ObjectId | undefined>
        ];
        await post.save();
      }

      // idea: we can add some email verification to add a post if we see a lot of traffic in the future
      return res.status(StatusCodes.OK).send({ saved: false, message: "Post successfully unsaved !" });
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

  const publicProfile = omit(user.toJSON(), userPrivateFields);

  return res.status(StatusCodes.OK).send({ ownerProfile: publicProfile, post });
}

export async function getAllPostsHandler(req: Request, res: Response) {}
