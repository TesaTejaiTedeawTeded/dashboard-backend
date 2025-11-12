import Camera from "../models/Camera.js";

const sanitizePayload = (payload = {}) => {
    const result = {};
    if (payload.cameraId !== undefined) {
        result.cameraId = String(payload.cameraId).trim();
    }
    if (payload.name !== undefined) {
        result.name = String(payload.name).trim();
    }
    if (payload.description !== undefined) {
        result.description = String(payload.description).trim();
    }
    return result;
};

export const listCameras = async (req, res) => {
    try {
        const cameras = await Camera.find().sort({ createdAt: -1 });
        res.json(cameras);
    } catch (err) {
        res.status(500).json({ message: "Unable to fetch cameras", error: err.message });
    }
};

export const createCamera = async (req, res) => {
    try {
        const { cameraId, name, description } = sanitizePayload(req.body);
        if (!cameraId || !name) {
            return res.status(400).json({ message: "cameraId and name are required" });
        }

        const existing = await Camera.findOne({ cameraId });
        if (existing) {
            return res.status(409).json({ message: "Camera ID already exists" });
        }

        const camera = await Camera.create({ cameraId, name, description });
        res.status(201).json(camera);
    } catch (err) {
        res.status(500).json({ message: "Unable to create camera", error: err.message });
    }
};

export const updateCamera = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = sanitizePayload(req.body);
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: "No fields provided for update" });
        }

        const updated = await Camera.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true,
        });

        if (!updated) {
            return res.status(404).json({ message: "Camera not found" });
        }

        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: "Unable to update camera", error: err.message });
    }
};

export const deleteCamera = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Camera.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ message: "Camera not found" });
        }

        res.json({ message: "Camera removed" });
    } catch (err) {
        res.status(500).json({ message: "Unable to delete camera", error: err.message });
    }
};
