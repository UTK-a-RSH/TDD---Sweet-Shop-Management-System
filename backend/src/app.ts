import express, { Request, Response } from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import sweetsRoutes from "./routes/sweets";
import {
  jsonParser,
  requestLogger,
  securityHeaders,
  sanitizeRequest,
  notFoundHandler,
  errorHandler,
} from "./middleware";

const app = express();

// Security middleware
app.use(securityHeaders);
app.use(cors());

// Request parsing middleware
app.use(jsonParser);
app.use(sanitizeRequest);

// Logging middleware (disable in test environment)
if (process.env.NODE_ENV !== "test") {
  app.use(requestLogger);
}

// Health check endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/sweets", sweetsRoutes);

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
