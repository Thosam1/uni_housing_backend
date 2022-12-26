import { logger } from "@typegoose/typegoose/lib/logSettings";
import { Request, Response } from "express";
import { nanoid } from "nanoid";
import {
  CreateUserInput,
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

const SOURCE_EMAIL = "test@example.com";

// function to create a new user
export async function createUserHandler(
  req: Request<{}, {}, CreateUserInput>,
  res: Response
) {
  logger.log("beginning");
  const body = req.body;
  logger.log("after");
  try {
    const user = await createUser(body); // do not check if already exists, in our model we had for email unique: true

    // after creating the user, we want to send an email with a verification code
    await sendEmail({
      to: user.email, 
      from: SOURCE_EMAIL, //todo change with our own mail address
      subject: "Verify your email",
      text: `verification code: ${user.verificationCode}. Id: ${user._id}`,
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
    return res.send("Could not verify user");
  }

  // check to see if they are already verified
  if (user.verified) {
    return res.send("User is already verified");
  }

  // check to see if the verificationCode matches
  if (user.verificationCode === verificationCode) {
    user.verified = true;

    await user.save();

    return res.send("User successfully verified");
  }

  return res.send("Could not verify user");
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
    log.debug(`User with email ${email} does not exists`);
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
    from: SOURCE_EMAIL,
    subject: "Reset your password",
    text: `Password reset code: ${passwordResetCode}. Id ${user._id}`,
  });

  log.debug(`Password reset email sent to ${email}`);

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

export async function getCurrentUserHandler(req: Request, res: Response) {
  // because deserializeUser middleware used in app.ts
  return res.send(res.locals.user);
}
