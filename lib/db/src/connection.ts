import mongoose from "mongoose";

let connectionPromise: Promise<void> | null = null;

export function connectDB(): Promise<void> {
  if (connectionPromise) return connectionPromise;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGODB_URI environment variable is required. Add it to your .env file.",
    );
  }

  connectionPromise = mongoose
    .connect(uri, { bufferCommands: false })
    .then(() => {
      console.log("[db] MongoDB connected successfully");

      mongoose.connection.on("error", (err) => {
        console.error("[db] MongoDB error:", err);
        connectionPromise = null;
      });
      mongoose.connection.on("disconnected", () => {
        console.warn("[db] MongoDB disconnected");
        connectionPromise = null;
      });
    })
    .catch((err) => {
      connectionPromise = null;
      throw err;
    });

  return connectionPromise;
}
