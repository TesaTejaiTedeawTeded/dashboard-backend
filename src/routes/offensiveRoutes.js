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
    const DEFAULT_LIMIT = 200;
    const MAX_LIMIT = 1000;

    const parseDate = (value) => {
        if (!value) return null;
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? null : date;
    };

    const buildHistoryQuery = (query = {}) => {
        const start = parseDate(query.start);
        const end = parseDate(query.end);
        const limit = Math.min(
            Math.max(Number(query.limit) || DEFAULT_LIMIT, 1),
            MAX_LIMIT
        );

        const filter = {};
        if (start || end) {
            filter.timestamp = {};
            if (start) filter.timestamp.$gte = start;
            if (end) filter.timestamp.$lte = end;
        }

        if (query.droneId && query.droneId !== "all") {
            filter.droneId = query.droneId;
        }

        return { filter, limit };
    };

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
            const { filter, limit } = buildHistoryQuery(req.query);
            const records = await Offensive.find(filter)
                .sort({ timestamp: -1 })
                .limit(limit);
            res.json(records);
        } catch (error) {
            console.error("❌ Error loading offensive data:", error);
            res.status(500).json({ error: "Failed to load offensive data" });
        }
    });

    router.get("/drones", async (req, res) => {
        try {
            const aggregates = await Offensive.aggregate([
                {
                    $group: {
                        _id: "$droneId",
                        count: { $sum: 1 },
                        lastSeen: { $max: "$timestamp" },
                    },
                },
                { $match: { _id: { $ne: null } } },
                { $sort: { lastSeen: -1 } },
            ]);

            res.json(
                aggregates.map((item) => ({
                    droneId: item._id,
                    count: item.count,
                    lastSeen: item.lastSeen,
                }))
            );
        } catch (error) {
            console.error("❌ Error loading offensive drones:", error);
            res.status(500).json({ error: "Failed to load offensive drones" });
        }
    });

    return router;
};
