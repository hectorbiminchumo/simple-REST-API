import express, { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { createClient } from "redis";

const app = express();
app.use(express.json());

// 🚀 Rate Limiting: Allows max 5 requests per minute per user
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Max 5 requests per minute
  message: "Too many requests, please try again later.",
});
app.use("/data", limiter);

// 🚀 Redis Caching Setup
const redisClient = createClient();
redisClient.connect().then(() => console.log("✅ Redis Connected!"));

// 🚀 Custom Error Handling Middleware
function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error("❌ Error:", err.message);
  res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
}

// 🚀 API Route with Caching
app.get("/data", async (req: any, res: any, next: NextFunction) => {
  try {
    const cacheKey = "myData";
    const cachedData = await redisClient.get(cacheKey);

    if (cachedData) {
      return res.json({ data: JSON.parse(cachedData), source: "cache" });
    }

    // Fake API data
    const freshData = { message: "Hello, fresh data!" };

    // Store in Redis (expires in 60 seconds)
    await redisClient.setEx(cacheKey, 60, JSON.stringify(freshData));

    res.json({ data: freshData, source: "API" });
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler;

// 🚀 Use the error handler
app.use(errorHandler);

// 🚀 Start Server
app.listen(3000, () => console.log("🚀 Server running on port 3000"));
