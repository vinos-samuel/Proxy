import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { randomBytes } from "crypto";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { logger } from "./logger";

const app = express();
const httpServer = createServer(app);

// Security: Add helmet as first middleware
app.use(helmet());

app.use(
  express.json({
    verify: (req, _res, buf) => {
      (req as any).rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Rate limiters
const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per windowMs
  standardHeaders: false,
  skip: (req) => !req.path.startsWith("/api"),
  handler: (_req, res) => {
    res.status(429).json({ error: "Too many requests, please try again later." });
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per windowMs
  standardHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({ error: "Too many requests, please try again later." });
  },
});

const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 requests per windowMs
  standardHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({ error: "Too many requests, please try again later." });
  },
});

// Apply general API limiter to all /api/* routes
app.use("/api/", generalApiLimiter);

// Apply auth limiter to login, register, and password reset
app.post("/api/auth/login", authLimiter);
app.post("/api/auth/register", authLimiter);
app.post("/api/auth/forgot-password", authLimiter);
app.post("/api/auth/reset-password", authLimiter);

// Apply chat limiter to the public portfolio chat endpoint
app.post("/api/chat/:username", chatLimiter);

// CSRF protection using double-submit cookie pattern
app.use((req: Request, res: Response, next: NextFunction) => {
  // Generate CSRF token on GET requests (non-API routes)
  if (req.method === "GET" && !req.path.startsWith("/api")) {
    const csrfToken = randomBytes(32).toString("hex");
    res.cookie("csrf-token", csrfToken, {
      httpOnly: false, // Allow JS to read it
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });
  }

  // Validate CSRF token on state-changing API requests (except Stripe webhook)
  if (["POST", "PUT", "DELETE", "PATCH"].includes(req.method) && 
      req.path.startsWith("/api") && 
      req.path !== "/api/stripe/webhook") {
    const tokenFromHeader = req.headers["x-csrf-token"] as string;
    const tokenFromCookie = req.cookies["csrf-token"] as string;

    if (!tokenFromHeader || !tokenFromCookie || tokenFromHeader !== tokenFromCookie) {
      return res.status(403).json({ error: "Invalid CSRF token" });
    }
  }

  next();
});

export function log(message: string, source = "express") {
  logger.info(message, { source });
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  const { seedDatabase } = await import("./seed");
  await seedDatabase();

  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    logger.error(message, {
      status,
      path: req.path,
      method: req.method,
      stack: err.stack,
    });

    if (res.headersSent) {
      return next(err);
    }

    const response: any = { message };
    if (process.env.NODE_ENV !== "production" && err.stack) {
      response.stack = err.stack;
    }
    return res.status(status).json(response);
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
