import express from "express";
import Message from "../models/Message.js";

const router = express.Router();

router.get("/", async (req, res) => {
    const messages = await Message.find().sort({ createdAt: -1 }).limit(50);
    res.json(messages);
});

router.get("/range", async (req, res) => {
    try {
        const { start, end } = req.query;

        if (!start || !end) {
            return res.status(400).json({ error: "start and end timestamps required" });
        }

        const result = await Message.find({
            createdAt: {
                $gte: new Date(start),
                $lte: new Date(end),
            },
        }).sort({ createdAt: -1 });

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: "Server error", details: err.message });
    }
});

export default router;
