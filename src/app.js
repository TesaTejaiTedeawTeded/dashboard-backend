import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import cookieParser from "cookie-parser";

const buildAllowedOrigins = () => {
    const origins = (process.env.CLIENT_ORIGIN || "")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);

    if (!origins.length) {
        origins.push("http://localhost:5173");
    }

    return origins;
};

export const createApp = () => {
    const app = express();

    app.use(
        cors({
            origin: buildAllowedOrigins(),
            credentials: true,
        })
    );
    app.use(express.json({ limit: "10mb" }));
    app.use(cookieParser());
    app.use(morgan("dev"));
    app.use("/uploads", express.static(path.resolve("uploads")));

    app.get("/health", (req, res) =>
        res.json({ status: "ok", environment: process.env.NODE_ENV || "dev" })
    );

    return app;
};

export default createApp;
