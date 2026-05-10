import express, { type Express } from "express";
import cors from "cors";
import session from "express-session";
import MongoStore from "connect-mongo";
import pinoHttp from "pino-http";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

const allowedOrigins = [
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
  /\.replit\.dev$/,
  /\.replit\.app$/,
  /\.vercel\.app$/,
  /\.up\.railway\.app$/,
  /\.onrender\.com$/,
];
const corsOriginEnv = process.env["CORS_ORIGIN"];
if (corsOriginEnv) {
  corsOriginEnv
    .split(",")
    .forEach((o) =>
      allowedOrigins.push(
        new RegExp(
          `^${o.trim().replace(/\./g, "\\.").replace(/\*/g, ".*")}$`,
        ),
      ),
    );
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.some((pat) => pat.test(origin))) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin "${origin}" not allowed`));
      }
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

const sessionSecret = process.env["SESSION_SECRET"];
if (!sessionSecret) {
  throw new Error("SESSION_SECRET environment variable is required");
}

const mongoUri = process.env["MONGODB_URI"];
if (!mongoUri) {
  throw new Error("MONGODB_URI environment variable is required");
}

app.set("trust proxy", 1);
app.use(
  session({
    store: MongoStore.create({
      mongoUrl: mongoUri,
      ttl: 60 * 60 * 24 * 30,
      touchAfter: 24 * 3600,
      autoRemove: "native",
    }),
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: process.env["NODE_ENV"] === "production",
      sameSite: process.env["NODE_ENV"] === "production" ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24 * 30,
    },
  }),
);

app.use("/api", router);

export default app;
