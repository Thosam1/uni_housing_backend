import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { omit } from "lodash";
import { nanoid } from "nanoid";
import { userPrivateFields } from "../model/user.model";
import {
  CreateUserInput,
  EditProfileInput,
  ForgotPasswordInput,
  getOwnedPostsInput,
  ResetPasswordInput,
  VerifyUserInput,
} from "../schema/user.schema";
import {
  createUser,
  findUserByEmail,
  findUserById,
} from "../service/user.service";
import log from "../utils/logger";
import sendEmail from "../utils/mailer";
import multer from "multer";
import { findPostById } from "../service/post.service";
import { postPreview, postPrivateFields } from "../model/post.model";

// function to create a new user
export async function createUserHandler(
  req: Request<{}, {}, CreateUserInput>,
  res: Response
) {
  const body = req.body;
  try {
    const user = await createUser(body); // do not check if already exists, in our model we had for email unique: true
    // after creating the user, we want to send an email with a verification code
    await sendEmail({
      to: user.email,
      from: "test@example.com", //todo change with our own mail address
      subject: "Verify your email",
      text: `verification code: ${user.verificationCode}. Id: ${user._id}`,
      // html:
    });

    return res.send("User successfully created");
  } catch (e: any) {
    if (e.code === 11000) {
      return res.status(StatusCodes.CONFLICT).send("Account already exists");
    }

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(e);
  }
}

export async function verifyUserHandler(
  req: Request<VerifyUserInput>,
  res: Response
) {
  const id = req.params.id;
  const verificationCode = req.params.verificationCode;

  // find the user by id
  const user = await findUserById(id);

  if (!user) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send("Could not verify user");
  }

  // check to see if they are already verified
  if (user.verified) {
    return res.status(StatusCodes.OK).send("User is already verified");
  }

  // check to see if the verificationCode matches
  if (user.verificationCode === verificationCode) {
    user.verified = true;

    await user.save();
    return res.send("User successfully verified");
  }

  return res
    .status(StatusCodes.INTERNAL_SERVER_ERROR)
    .send("Could not verify user");
}

export async function forgotPasswordHandler(
  req: Request<{}, {}, ForgotPasswordInput>,
  res: Response
) {
  // we don't want people to spam and see whether someone is registered (security)
  const message =
    "If a user with that email is registered you will receive a password reset email";

  const { email } = req.body;

  const user = await findUserByEmail(email);

  if (!user) {
    return res.send(message);
  }

  if (!user.verified) {
    return res.send("User is not verified");
  }

  const passwordResetCode = nanoid();

  user.passwordResetCode = passwordResetCode;

  await user.save();

  await sendEmail({
    to: user.email,
    from: "test@example.com", // process.env.OWNER_EMAIL,
    subject: "Reset your password",
    text: `Password reset code: ${passwordResetCode}. Id ${user._id}`,
  });

  return res.send(message);
}

export async function resetPasswordHandler(
  req: Request<ResetPasswordInput["params"], {}, ResetPasswordInput["body"]>,
  res: Response
) {
  const { id, passwordResetCode } = req.params;

  const { password } = req.body;

  const user = await findUserById(id);

  if (
    !user ||
    !user.passwordResetCode ||
    user.passwordResetCode !== passwordResetCode
  ) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .send("Could not reset user password");
  }

  user.passwordResetCode = null;

  user.password = password; // no need to hash, we have a presaved hook that will do the job in user.model.ts

  await user.save();

  return res.send("Password successfully updated");
}

// "/me"
export async function getCurrentUserHandler(req: Request, res: Response) {
  // because deserializeUser middleware used in app.ts
  log.info("in the getCurrentUser function")
  return res.send(res.locals.user);
}

// todo - get the user owned posts, and user saved posts / https://github.com/ed-roh/mern-social-media/blob/master/server/controllers/users.js
// const friends = await Promise.all(
//   user.friends.map((id) => User.findById(id))
// );
// const formattedFriends = friends.map(
//   ({ _id, firstName, lastName, occupation, location, picturePath }) => {
//     return { _id, firstName, lastName, occupation, location, picturePath };
//   }
// );

// settings
export async function editProfileHandler(
  req: Request<{}, {}, EditProfileInput>,
  res: Response
) {
  const { id, newFirstName, newLastName, newStatus, newBio } = req.body;

  // check first if id of the person to change corresponds to the access token received
  if (res.locals.user._id !== id) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .send("Hacking is punishable by law !");
  }

  const user = await findUserById(id);
  if (!user) {
    return res.status(StatusCodes.BAD_REQUEST).send("Could not edit profile");
  }

  // todo security measure, find a way to also check that the access token corresponds to the user id, otherwise, someone might be able to change the data of other users !!!
  if (!user.verified) {
    return res.status(StatusCodes.BAD_REQUEST).send("User is not verified");
  }

  // check, create a new service that checks the id with the access token
  user.firstName = newFirstName;
  user.lastName = newLastName;
  user.status = newStatus;
  user.bio = newBio;

  //   const storage = multer.diskStorage({
  //     destination: function (req, file, cb) {
  //         cb(null, 'uploads/avatars/')
  //     },
  //     filename: function (req, file, cb) {
  //         cb(null, id)
  //     }
  // });

  // let upload = multer({ storage: storage })

  //   // avatar :
  //   if(!!req.file) {
  //     upload(req, res, function(err) {
  //       if(err) {
  //           //stuff when error while file uploading
  //       } else {
  //           //file uploaded
  //       }
  //     res.json({
  //       url: `/uploads/avatars/${id}` // hopefully it overwrites
  //     });
  //   }

  await user.save();

  const updatedUser = await findUserById(id);
  if (!updatedUser) {
    return res.status(StatusCodes.BAD_REQUEST).send("Could not edit profile");
  }

  // sending back the user
  const payload = omit(updatedUser.toJSON(), userPrivateFields);
  return res.status(StatusCodes.OK).send(payload);
}

export async function editAvatarHandler(req: Request, res: Response) {
  log.info("\n\n\n\n ---------------------- \n\n\n\n");
  log.info("EDIT AVATAR HANDLER");

  // // to store user avatars
  // const storage = multer.diskStorage({
  //   destination: function (request, file, callback) {
  //     callback(null, "public");
  //   },
  //   filename: function (request, file, callback) {
  //     var temp_file_arr = file.originalname.split(".");

  //     var temp_file_name = temp_file_arr[0];

  //     var temp_file_extension = temp_file_arr[1];

  //     callback(
  //       null,
  //       temp_file_name + "-" + Date.now() + "." + temp_file_extension
  //     );
  //   },
  // });

  // const upload = multer({ storage: storage }).single("image");

  // upload(req, res, function (error) {
  //   if (error) {
  //     return res.status(StatusCodes.BAD_REQUEST).send("Error Uploading File");
  //   } else {
  //     log.info("uploaded yeeey");
  //     return res.status(StatusCodes.OK).send("File is uploaded successfully");
  //   }
  // });

  log.info(req)
  log.info("req.file is : ")
  log.info(req.file?.filename);
  log.info(req.file?.path);
  log.info(req.file?.size);

  // req.file.

  return res.status(StatusCodes.OK).send("Avatar has been updated successfully");

}

export async function getOwnedPostsHandler(req: Request<{}, {}, getOwnedPostsInput>, res: Response) {

  const { id } = req.body;

  // check first if id of the person to change corresponds to the access token received
  if (res.locals.user._id !== id) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .send("Hacking is punishable by law !");
  }

  const user = await findUserById(id);
  if (!user) {
    return res.status(StatusCodes.BAD_REQUEST).send("Could not get owned posts");
  }

  const posts = await Promise.all(
    user.ownedPosts.map((id) => findPostById(id))
  );

  const omitted = posts.map((post) => omit(post?.toJSON(), postPreview));

  return res.status(StatusCodes.OK).send(omitted);
}

export async function getSavedPostsHandler(req: Request<{}, {}, getOwnedPostsInput>, res: Response) {

  const { id } = req.body;

  // check first if id of the person to change corresponds to the access token received
  if (res.locals.user._id !== id) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .send("Hacking is punishable by law !");
  }

  const user = await findUserById(id);
  if (!user) {
    return res.status(StatusCodes.BAD_REQUEST).send("Could not get saved posts");
  }

  const posts = await Promise.all(
    user.savedPosts.map((id) => findPostById(id))
  );

  const omitted = posts.map((post) => omit(post?.toJSON(), postPrivateFields));

  return res.status(StatusCodes.OK).send(omitted);
  
}