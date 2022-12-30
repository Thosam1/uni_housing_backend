import { DocumentType } from "@typegoose/typegoose";
import { Request, Response } from "express";
import { get } from "lodash";
import { User } from "../model/user.model";
import { CreateSessionInput } from "../schema/auth.schema";
import {
  findSessionById,
  signAccessToken,
  signRefreshToken,
} from "../service/auth.service";
import { findUserByEmail, findUserById } from "../service/user.service";
import { verifyJwt } from "../utils/jwt";
import log from "../utils/logger";

// for google, facebook, the logic should be here if implemented

export async function createSessionHandler(
  req: Request<{}, {}, CreateSessionInput>,
  res: Response
) {

  log.info("HERE")
  const message = "Invalid email or password";
  const { email, password } = req.body;

  const user = await findUserByEmail(email);

  if (!user) {
    return res.send(message);
  }

  log.info("HERE2")

  if (!user.verified) {
    return res.send("Please verify your email");
  }

  const isValid = await user.validatePassword(password);

  log.info("HERE3")
  if (!isValid) {
    return res.send(message);
  }
  log.info("HERE4")
  // sign a access token
  const accessToken = signAccessToken(user);

  // sign a refresh token
  const refreshToken = await signRefreshToken({ userId: user._id });

  log.info(`accessToken: ${accessToken} \n\n refreshToken: ${refreshToken}`);


  // send the tokens
  // res.cookie("jwt", refreshToken);
  // res.json({ accessToken });

  res.cookie("refreshToken", refreshToken, {
    maxAge: 3.154e10, // 1 year
    httpOnly: true,
    domain: process.env.COOKIE_DOMAIN || 'localhost',
    path: '/',
    sameSite: 'strict',
    secure: false, // todo in production we must put to true, only over a secure connection
  }).cookie("accessToken", accessToken, {
    maxAge: 3.154e10, // 1 year
    httpOnly: true,
    domain: process.env.COOKIE_DOMAIN || 'localhost',
    path: '/',
    sameSite: 'strict',
    secure: false, // todo in production we must put to true, only over a secure connection
  })

  return res.status(200).send({
    accessToken, // can be accessed from client with res.data.accessToken
  });
}

// when accessToken is expired -> frontend, we go to back to the login page (if code = 401)
export async function refreshAccessTokenHandler(req: Request, res: Response) {
  const refreshToken = get(req, "headers.x-refresh");

  const decoded = verifyJwt<{ session: string }>(
    refreshToken,
    "refreshTokenPublicKey"
  );

  if (!decoded) {
    return res.status(401).send("Could not refresh access token");
  }

  const session = await findSessionById(decoded.session);

  if (!session || !session.valid) {
    return res.status(401).send("Could not refresh access token");
  }

  const user = await findUserById(String(session.user));

  if (!user) {
    return res.status(401).send("Could not refresh access token");
  }

  const accessToken = signAccessToken(user);

  return res.send({ accessToken });
}
