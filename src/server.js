import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import { createApp } from "./app.js";
import { connectDB } from "./config/db.js";
import { registerRoutes } from "./routes/index.js";
import { errorHandler, notFound } from "./middlewares/errorMiddleware.js";
import { registerSocketHandlers } from "./socket/index.js";
import { initMQTT } from "./services/mqttService.js";

dotenv.config();

const app = createApp();
const httpServer = createServer(app);
const allowedOrigins = (process.env.CLIENT_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

if (!allowedOrigins.length) {
    allowedOrigins.push("http://localhost:5173");
}

const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        credentials: true,
    },
});

registerRoutes(app, io);
app.use(notFound);
app.use(errorHandler);
registerSocketHandlers(io);
initMQTT(io);

const PORT = process.env.PORT || 5000;

const start = async () => {
    try {
        await connectDB();
        httpServer.listen(PORT, () => {
            console.log(`🚀 Server ready on port ${PORT}`);
        });
    } catch (error) {
        console.error("❌ Failed to start server:", error);
        process.exit(1);
    }
};

start();
