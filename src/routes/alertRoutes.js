import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import Defensive from "../models/Defensive.js";

const ensureDir = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

const parseJSONField = (value, fallback = null) => {
    if (!value) return fallback;
    if (typeof value === "string") {
        try {
            return JSON.parse(value);
        } catch {
            return fallback;
        }
    }
    return value;
};

const imageExtFromMime = (mime = "") => {
    if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
    if (mime.includes("png")) return "png";
    if (mime.includes("gif")) return "gif";
    if (mime.includes("bmp")) return "bmp";
    return "png";
};

const saveBase64Image = (base64String) => {
    if (!base64String) return null;
    try {
        const dataMatch = /^data:(.+);base64,(.+)$/.exec(base64String);
        const mimeType = dataMatch ? dataMatch[1] : "image/png";
        const data = dataMatch ? dataMatch[2] : base64String;

        const buffer = Buffer.from(data, "base64");
        if (!buffer.length) return null;

        const uploadDir = path.join("uploads", "defensive");
        ensureDir(uploadDir);

        const extension = imageExtFromMime(mimeType);
        const filename = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
        const filepath = path.join(uploadDir, filename);
        fs.writeFileSync(filepath, buffer);
        return `/${filepath.replace(/\\\\/g, "/")}`;
    } catch (error) {
        console.error("⚠️ Failed to decode base64 image:", error.message);
        return null;
    }
};

const mapObjects = (objects = []) =>
    objects.map((obj) => ({
        objId:
            obj.objId ||
            obj.obj_id ||
            obj.id ||
            crypto.randomUUID(),
        lat:
            typeof obj.lat === "number"
                ? obj.lat
                : obj.lat
                  ? Number(obj.lat)
                  : null,
        long:
            typeof obj.long === "number"
                ? obj.long
                : typeof obj.lng === "number"
                  ? obj.lng
                  : obj.lng
                    ? Number(obj.lng)
                    : obj.long
                      ? Number(obj.long)
                      : null,
        alt:
            typeof obj.alt === "number"
                ? obj.alt
                : obj.alt
                  ? Number(obj.alt)
                  : null,
    }));

export default (io) => {
    const router = express.Router();

    router.post("/", async (req, res) => {
        try {
            const {
                cameraId = "unknown",
                timestamp,
                camLat,
                camLong,
                objects,
                imageBase64,
            } = req.body;

            const parsedObjects = parseJSONField(objects, objects);
            const sharedImagePath = saveBase64Image(imageBase64);

            const detection = await Defensive.create({
                cameraId,
                timestamp: timestamp ? new Date(timestamp) : new Date(),
                camLat: camLat === undefined ? undefined : Number(camLat),
                camLong: camLong === undefined ? undefined : Number(camLong),
                imagePath: sharedImagePath,
                objects: mapObjects(parsedObjects || []),
            });

            const payload = detection.toObject();
            io.emit("defensive_alert", payload);
            res.status(201).json(payload);
        } catch (err) {
            console.error("❌ Error saving defensive data:", err);
            res.status(500).json({ error: "Failed to save defensive data" });
        }
    });

    router.get("/", async (req, res) => {
        const records = await Defensive.find()
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(records);
    });

    router.get("/history", async (req, res) => {
        try {
            const { start, end, limit, cameraId } = req.query;
            const startDate = start ? new Date(start) : new Date(0);
            const endDate = end ? new Date(end) : new Date();
            const limitValue = Number.isFinite(Number(limit))
                ? Math.min(Number(limit), 500)
                : 200;

            const query = {
                timestamp: {
                    $gte: startDate,
                    $lte: endDate,
                },
            };

            if (cameraId && cameraId !== "all") {
                query.cameraId = cameraId;
            }

            const records = await Defensive.find(query)
                .sort({ timestamp: -1 })
                .limit(limitValue);

            res.json(records);
        } catch (err) {
            console.error("❌ Error loading defensive history:", err);
            res.status(500).json({ error: "Failed to load defensive history" });
        }
    });

    router.get("/cameras", async (req, res) => {
        try {
            const cameras = await Defensive.aggregate([
                {
                    $group: {
                        _id: "$cameraId",
                        lastSeen: { $max: "$timestamp" },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { _id: 1 } },
            ]);

            res.json(
                cameras.map((camera) => ({
                    cameraId: camera._id,
                    lastSeen: camera.lastSeen,
                    count: camera.count,
                }))
            );
        } catch (err) {
            console.error("❌ Error loading camera list:", err);
            res.status(500).json({ error: "Failed to load camera list" });
        }
    });

    return router;
};
