import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { randomBytes } from "node:crypto";
import { initialize, transaction, now } from "./database.js";
import {
  Service,
  ApiError,
  need,
  text,
  password,
  publicUser,
} from "./service.js";
import { tokenHash, hashPassword, verifyPassword } from "./security.js";

import { validateEnvironment } from "./deployment.js";

validateEnvironment();
const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use((req, res, next) => {
  const hasBody =
    req.headers["transfer-encoding"] ||
    Number(req.headers["content-length"] || 0) > 0;
  if (hasBody && !req.is("application/json")) {
    return res
      .status(415)
      .json({ error: "Content-Type must be application/json" });
  }
  next();
});
app.use(express.json({ limit: "64kb", strict: true, inflate: false }));
app.use(cookieParser());
const allowed = new Set(
  (
    process.env.ALLOWED_ORIGINS ||
    "http://localhost:5173,http://localhost:8080,http://localhost:3000"
  ).split(","),
);
const cookie = {
  httpOnly: true,
  secure: (process.env.COOKIE_SECURE || "false").toLowerCase() === "true",
  sameSite: "strict",
  path: "/api",
  maxAge: 86400000,
};
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  try {
    if (req.method !== "GET")
      need(
        (!req.get("origin") || allowed.has(req.get("origin"))) &&
          req.get("sec-fetch-site") !== "cross-site",
        "Untrusted origin",
      );
    next();
  } catch (e) {
    next(e);
  }
});
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 40,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many attempts. Try again in 15 minutes." },
});
app.use(["/api/auth/login", "/api/auth/register"], limiter);
app.get("/api/health", (_req, res) =>
  res.json({ status: "ok", stack: "mern" }),
);
app.use("/api", async (req, res, next) => {
  try {
    need(
      !req.body || (!Array.isArray(req.body) && typeof req.body === "object"),
      "JSON object required",
      422,
    );
    const path = req.path.replace(/^\//, ""),
      d = req.body || {};
    const result = await transaction(req.method !== "GET", (db) => {
      const svc = new Service(db);
      if (
        ["auth/login", "auth/register"].includes(path) &&
        req.method === "POST"
      ) {
        const email = text(d, "email", 3, 254).toLowerCase();
        need(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), "Invalid email", 422);
        const users = svc.rows("users", { email });
        let user;
        if (path === "auth/register") {
          need(!users.length, "Email already registered", 409);
          user = db.insert("users", {
            name: text(d, "name", 2, 80),
            email,
            password_hash: hashPassword(password(d)),
            role: "student",
            active: true,
          });
        } else {
          const supplied = d.password;
          need(
            typeof supplied === "string" &&
              supplied.length >= 1 &&
              supplied.length <= 128,
            "Invalid password",
            422,
          );
          need(
            users.length &&
              users[0].active &&
              verifyPassword(supplied, users[0].password_hash),
            "Incorrect email or password",
            401,
          );
          user = users[0];
        }
        for (const s of db.all("sessions"))
          if (s.expires_at <= now()) db.delete("sessions", s.id);
        const token = randomBytes(32).toString("base64url");
        db.insert("sessions", {
          id: tokenHash(token),
          user_id: user.id,
          expires_at: new Date(Date.now() + 86400000)
            .toISOString()
            .replace(/\.\d{3}Z$/, "Z"),
        });
        return {
          body: { user: publicUser(user) },
          token,
          status: path === "auth/register" ? 201 : 200,
        };
      }
      const s = db.get("sessions", tokenHash(req.cookies.ascent_session || ""));
      need(s && s.expires_at > now(), "Sign in to continue", 401);
      const user = db.get("users", s.user_id);
      need(user && user.active, "Account unavailable", 401);
      svc.user = user;
      if (path === "auth/logout" && req.method === "POST") {
        db.delete("sessions", s.id);
        return { body: { message: "Signed out" }, logout: true };
      }
      if (path === "auth/me" && req.method === "GET")
        return { body: { user: publicUser(user) } };
      return { body: svc.dispatch(req.method, path, d) };
    });
    if (result.token) res.cookie("ascent_session", result.token, cookie);
    if (result.logout) res.clearCookie("ascent_session", { path: "/api" });
    res.status(result.status || 200).json(result.body);
  } catch (e) {
    next(e);
  }
});
app.use((err, _req, res, _next) => {
  if (err instanceof ApiError)
    return res.status(err.status).json({ error: err.message });
  if (err.code === 11000)
    return res.status(409).json({ error: "This record already exists" });
  if (err.type === "encoding.unsupported")
    return res
      .status(415)
      .json({ error: "Compressed request bodies are not supported" });
  if (err.type === "entity.too.large")
    return res.status(413).json({ error: "Request too large" });
  if (err instanceof SyntaxError)
    return res.status(400).json({ error: "Invalid JSON" });
  console.error(err);
  res.status(500).json({ error: "Unexpected server error" });
});
await initialize();
const server = app.listen(Number(process.env.PORT || 8000), "0.0.0.0", () =>
  console.log(`Ascent API on port ${process.env.PORT || 8000}`),
);
process.on("SIGTERM", () => server.close(() => process.exit(0)));
