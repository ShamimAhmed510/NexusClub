import mongoose from "mongoose";
import { logger } from "./logger";

export async function connectMongoDB(): Promise<void> {
  const uri = process.env["MONGODB_URI"];

  if (!uri) {
    throw new Error(
      "MONGODB_URI environment variable is required but was not provided.",
    );
  }

  mongoose.connection.on("connected", () => {
    logger.info("MongoDB connection established");
  });

  mongoose.connection.on("error", (err) => {
    logger.error({ err }, "MongoDB connection error");
  });

  mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB disconnected");
  });

  await mongoose.connect(uri);
}
