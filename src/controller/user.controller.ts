import { logger } from "@typegoose/typegoose/lib/logSettings";
import { Request, Response } from "express";
import { nanoid } from "nanoid";
import {
  CreateUserInput,
  EditProfileInput,
  ForgotPasswordInput,
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
      return res.status(409).send("Account already exists");
    }

    return res.status(500).send(e);
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
    return res.status(500).send("Could not verify user");
  }

  // check to see if they are already verified
  if (user.verified) {
    return res.status(200).send("User is already verified");
  }

  // check to see if the verificationCode matches
  if (user.verificationCode === verificationCode) {
    user.verified = true;

    await user.save();
    return res.send("User successfully verified");
  }

  return res.status(500).send("Could not verify user");
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
    return res.status(400).send("Could not reset user password");
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


// settings
export async function editProfileHandler(
  req: Request<{}, {}, EditProfileInput>,
  res: Response
) {
  const { id, newFirstName, newLastName, newStatus, newBio } = req.body;
  const user = await findUserById(id);

  if(!user) {
    return res.status(400).send("Could not edit profile");
  }

  // todo security measure, find a way to also check that the access token corresponds to the user id, otherwise, someone might be able to change the data of other users !!!
  if (!user.verified) {
    return res.status(400).send("User is not verified");
  }

  // check, create a new service that checks the id with the access token

  user.firstName = newFirstName;
  user.lastName = newLastName;
  user.status = newStatus;
  user.bio = newBio;

  await user.save();
  return res.status(200).send("Profile successfully updated");
}
