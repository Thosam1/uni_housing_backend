import { Request, Response, NextFunction } from "express";
import { verifyJwt } from "../utils/jwt";
import log from "../utils/logger";

/* Middleware that : get the access token from the header -> we want to do this at each request !*/
const deserializeUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  const accessToken = (req.headers.authorization || req.cookies.accessToken || "").replace(
    /^Bearer\s/,
    ""
  );

  // log.info(`entering deserializeUser : \naccess token received is: ${ accessToken }`);

  if (!accessToken) { 
    return next();
  }

  // log.info("We got an access token !!!")

  const decoded = verifyJwt(accessToken, "accessTokenPublicKey");

  // log.info(`we are decoding the token !`)
  if (decoded) {
    // log.info(`we decoded the access token ! ${decoded}`)
    res.locals.user = decoded;
  }
  // log.info("exiting the deserializeUser middleware\n")
  return next();
};

export default deserializeUser;
