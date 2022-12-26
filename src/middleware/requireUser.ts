import { Request, Response, NextFunction } from "express";

/* To make sure the user is logged in before accessing some routes */
const requireUser = (req: Request, res: Response, next: NextFunction) => {
  const user = res.locals.user;

  if (!user) {
    return res.sendStatus(403);
  }

  return next();
};

export default requireUser;
