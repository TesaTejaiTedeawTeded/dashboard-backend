import express from "express";
import Offensive from "../models/Offensive.js";

const toNumber = (value) => {
    if (value === undefined || value === null || value === "") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const coerceTimestamp = (value) => {
    if (!value) return new Date();
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const collectDetections = (body = {}) => {
    if (Array.isArray(body.detections)) return body.detections;
    if (Array.isArray(body.objects)) return body.objects;
    if (Array.isArray(body.data?.objects)) return body.data.objects;
    if (Array.isArray(body.data?.detections)) return body.data.detections;
    if (body.droneId || body.drone_id) return [body];
    return [];
};

const normalizeDetection = (raw = {}) => {
    const droneId =
        raw.droneId ||
        raw.drone_id ||
        raw.objId ||
        raw.obj_id ||
        raw.id ||
        null;
    const lat = toNumber(raw.lat);
    const long =
        toNumber(raw.long) ?? toNumber(raw.lng) ?? toNumber(raw.lon);
    const alt = toNumber(raw.alt);
    const timestamp = coerceTimestamp(
        raw.timestamp || raw.ts || raw.detectedAt
    );

    if (!droneId || lat === null || long === null) {
        return null;
    }

    return {
        droneId,
        lat,
        long,
        alt,
        timestamp,
    };
};

export default (io) => {
    const router = express.Router();

    router.post("/", async (req, res) => {
        try {
            const cameraId = req.body.camId || req.body.cam_id || "UNKNOWN";
            const cameraMeta = req.body.camera || null;
            const detections = collectDetections(req.body)
                .map(normalizeDetection)
                .filter(Boolean);

            if (!detections.length) {
                return res.status(400).json({
                    error:
                        "At least one detection with droneId, lat, and long is required.",
                });
            }

            await Offensive.insertMany(
                detections.map((det) => ({
                    droneId: det.droneId,
                    lat: det.lat,
                    long: det.long,
                    alt: det.alt,
                    timestamp: det.timestamp,
                }))
            );

            const responsePayload = {
                cam_id: cameraId,
                camera: cameraMeta,
                timestamp:
                    req.body.timestamp ||
                    detections[detections.length - 1].timestamp.toISOString(),
                objects: detections.map((det) => ({
                    droneId: det.droneId,
                    lat: det.lat,
                    long: det.long,
                    alt: det.alt,
                    timestamp: det.timestamp.toISOString(),
                })),
            };

            io?.emit("object_detection", responsePayload);
            res.status(201).json(responsePayload);
        } catch (error) {
            console.error("❌ Error saving offensive data:", error);
            res.status(500).json({ error: "Failed to save offensive data" });
        }
    });

    router.get("/", async (req, res) => {
        try {
            const records = await Offensive.find()
                .sort({ timestamp: -1 })
                .limit(200);
            res.json(records);
        } catch (error) {
            console.error("❌ Error loading offensive data:", error);
            res.status(500).json({ error: "Failed to load offensive data" });
        }
    });

    return router;
};
