import express from "express";
import Defensive from "../models/Defensive.js";

export default (io) => {
    const router = express.Router();

    router.post("/", async (req, res) => {
        try {
            const data = await Defensive.create(req.body);
            io.emit("defensive_alert", data);
            res.status(201).json(data);
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

    return router;
};
