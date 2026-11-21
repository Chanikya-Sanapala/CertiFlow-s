import Redis from "ioredis";

const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = Number(process.env.REDIS_PORT) || 6379;

export const redisConnection = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    return Math.min(times * 50, 2000);
  },
});

redisConnection.on("connect", () => {
  console.log("Connected to Redis at", `${REDIS_HOST}:${REDIS_PORT}`);
});

redisConnection.on("error", (err) => {
  console.error("Redis connection error:", err.message);
});

export default redisConnection;

