import { DocumentType } from "@typegoose/typegoose";
import { omit } from "lodash";
import SessionModel from "../model/session.model";
import { userPrivateFields, User } from "../model/user.model";
import { signJwt } from "../utils/jwt";
import { findUserById } from "./user.service";

export async function createSession({ userId }: { userId: string }) {
  return SessionModel.create({ user: userId });
}

export async function findSessionById(id: string) {
  return SessionModel.findById(id);
}

export async function signRefreshToken({ userId }: { userId: string }) {
  const session = await createSession({
    userId,
  });

  const refreshToken = signJwt(
    {
      session: session._id,
    },
    "refreshTokenPrivateKey",
    {
      expiresIn: "1y", // 1y - 1 year
    }
  );

  return refreshToken;
}

// create an access token for a giver user
export function signAccessToken(user: DocumentType<User>) {
  // so we do not send privateFields
  const payload = omit(user.toJSON(), userPrivateFields);

  const accessToken = signJwt(payload, "accessTokenPrivateKey", {
    expiresIn: "45m", // 15m - 15 minutes
  });

  return accessToken;
}
