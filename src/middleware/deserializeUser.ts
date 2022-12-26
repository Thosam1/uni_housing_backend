import { Request, Response, NextFunction } from "express";
import { verifyJwt } from "../utils/jwt";

/* Middleware that : get the access token from the header -> we want to do this at each request !*/
const deserializeUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  const accessToken = (req.headers.authorization || "").replace(
    /^Bearer\s/,
    ""
  );

  if (!accessToken) {
    return next();
  }

  const decoded = verifyJwt(accessToken, "accessTokenPublicKey");

  if (decoded) {
    res.locals.user = decoded;
  }

  return next();
};

export default deserializeUser;
