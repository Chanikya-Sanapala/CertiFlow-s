import { Request, Response, NextFunction } from "express";

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error("API Error:", err);

  if (err?.name === "ZodError" || err?.issues) {
    const issues = err.issues || err.errors || [];
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: issues.map((e: any) => ({
        field: Array.isArray(e.path) ? e.path.join(".") : String(e.path),
        message: e.message,
      })),
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  return res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
