import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import log from "../utils/logger";

/* To make sure the user is logged in before accessing some routes */
const requireUser = (req: Request, res: Response, next: NextFunction) => {
  // log.info("entering requireUser")
  const user = res.locals.user;

  if (!user) {
    return res.sendStatus(StatusCodes.FORBIDDEN);
  }
  // log.info("all good, exiting requireUser")
  return next();
};

export default requireUser;
