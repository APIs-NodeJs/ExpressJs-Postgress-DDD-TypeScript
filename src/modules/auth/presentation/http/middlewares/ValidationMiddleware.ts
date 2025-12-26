import { Request, Response, NextFunction } from "express";
import { plainToClass } from "class-transformer";
import { validate, ValidationError } from "class-validator";

export class ValidationMiddleware {
  static validate(dtoClass: any) {
    return async (
      req: Request,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      const dtoObject = plainToClass(dtoClass, req.body);
      const errors: ValidationError[] = await validate(dtoObject);

      if (errors.length > 0) {
        const messages = errors
          .map((error) => {
            return Object.values(error.constraints || {});
          })
          .flat();

        res.status(400).json({
          success: false,
          errors: messages,
        });
        return;
      }

      req.body = dtoObject;
      next();
    };
  }
}
