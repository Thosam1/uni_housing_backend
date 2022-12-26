import { Request, Response, NextFunction } from "express";
import { AnyZodObject } from "zod";

// middleware to validate input, adapts to any schema
// directly validating from the routes/ folder !!!
const validateResource =
  (schema: AnyZodObject) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (e: any) {
      return res.status(400).send(e.errors);
    }
  };

export default validateResource;
