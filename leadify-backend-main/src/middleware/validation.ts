import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { NextFunction, Request, Response } from 'express';
import { ParsedQs } from 'qs';
import 'reflect-metadata';

// Type definition for ClassConstructor
type ClassConstructor<T> = {
  new (...args: any[]): T;
};

// Helper function to format errors recursively
interface ValidationErrorFormatted {
  property: string;
  constraints: Record<string, string>;
  children?: ValidationErrorFormatted[];
}

function formatValidationErrors(errors: { property: string; constraints?: Record<string, string>; children?: unknown[] }[]): ValidationErrorFormatted[] {
  return errors.map(error => {
    const formattedError: ValidationErrorFormatted = {
      property: error.property,
      constraints: error.constraints || {}
    };

    if (error.children && error.children.length > 0) {
      formattedError.children = formatValidationErrors(error.children);
    }

    return formattedError;
  });
}

// Main validation middleware
export function validateBody<T extends object>(dtoClass: ClassConstructor<T>) {
  return async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      // Step 1: Transform the body into an instance of the DTO class
      const dtoObject = plainToInstance(dtoClass, req.body, {
        excludeExtraneousValues: false // Retain all fields for extra fields check
      });

      // Step 2 & 3: Checking for extra fields is handled more reliably by class-validator
      // in Step 4 using { whitelist: true, forbidNonWhitelisted: true }

      // Step 4: Validate the transformed DTO object
      const errors = await validate(dtoObject, { whitelist: true, forbidNonWhitelisted: true });
      if (errors.length > 0) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: formatValidationErrors(errors) // Use the helper function for detailed formatting
        });
      }
      // Step 5: Sanitize the DTO object by removing undefined or null values
      const sanitizedQuery = Object.fromEntries(Object.entries(dtoObject).filter(([_, value]) => value !== undefined));

      // Step 6: Assign sanitized query to req.query
      req.body = sanitizedQuery;
      next(); // Call the next middleware
    } catch (error) {
      next(error);
    }
  };
}

// Middleware for validating the query
export function validateQuery<T extends object>(dtoClass: ClassConstructor<T>) {
  return async (
    req: Request<Record<string, string>, Record<string, unknown>, Record<string, unknown>, ParsedQs>,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      // Step 1: Transform the query params into an instance of the DTO class
      const dtoObject = plainToInstance(dtoClass, req.query, {
        excludeExtraneousValues: false // Retain all fields for extra fields check
      });

      // Step 2 & 3: Checking for extra fields is handled more reliably by class-validator
      // during the validation step.

      // Step 4: Validate the transformed DTO object
      const errors = await validate(dtoObject);
      if (errors.length > 0) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: errors.map(err => ({
            property: err.property,
            constraints: err.constraints
          }))
        });
      }
      // Step 5: Sanitize the DTO object by removing undefined or null values
      const sanitizedQuery = Object.fromEntries(Object.entries(dtoObject).filter(([_, value]) => value !== undefined));

      // Step 6: Assign sanitized query to req.query
      req.query = sanitizedQuery;
      next(); // Call the next middleware
    } catch (error) {
      next(error);
    }
  };
}
