import mqtt from "mqtt";
import Message from "../models/Message.js";
import Offensive from "../models/Offensive.js";

const toNumber = (value) => {
    if (value === undefined || value === null || value === "") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const normalizeMqttDetection = (raw = {}) => {
    if (!raw) return null;
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

    if (!droneId || lat === null || long === null) {
        return null;
    }

    return {
        droneId,
        lat,
        long,
        alt,
    };
};

const buildSocketPayload = (detection, context = {}) => {
    if (!detection) return null;
    const timestamp = detection.timestamp.toISOString();
    return {
        cam_id:
            context.cam_id ||
            context.camId ||
            context.cameraId ||
            "MQTT_OFFENSIVE",
        camera: context.camera || null,
        timestamp,
        objects: [
            {
                droneId: detection.droneId,
                lat: detection.lat,
                long: detection.long,
                alt: detection.alt,
                timestamp,
            },
        ],
    };
};

export const initMQTT = (io) => {
    const brokerUrl = process.env.MQTT_BROKER;
    const topic = process.env.MQTT_TOPIC;

    if (!brokerUrl || !topic) {
        console.warn(
            "⚠️  MQTT_BROKER or MQTT_TOPIC is not configured. Skipping MQTT initialization."
        );
        return;
    }

    const client = mqtt.connect(brokerUrl);

    client.on("connect", () => {
        console.log("✅ MQTT connected");
        client.subscribe(topic, () =>
            console.log(`📡 Subscribed to ${topic}`)
        );
    });

    client.on("message", async (incomingTopic, messageBuffer) => {
        const payload = messageBuffer.toString();
        console.log(`📩 [MQTT] ${incomingTopic}: ${payload}`);

        await Message.create({ topic: incomingTopic, payload });

        let parsed;
        try {
            parsed = JSON.parse(payload);
        } catch (error) {
            console.warn("⚠️ MQTT payload is not valid JSON, skipping.");
            return;
        }

        const normalized = normalizeMqttDetection(parsed);
        if (!normalized) {
            console.warn(
                "⚠️ MQTT payload missing droneId/lat/long, skipping offensive insert."
            );
            return;
        }

        try {
            const record = await Offensive.create({
                droneId: normalized.droneId,
                lat: normalized.lat,
                long: normalized.long,
                alt: normalized.alt,
                timestamp: new Date(),
            });

            const socketPayload = buildSocketPayload(record, parsed);
            if (socketPayload) {
                io.emit("object_detection", socketPayload);
            }
        } catch (error) {
            console.error("❌ Failed to persist/emit offensive MQTT data:", error);
        }

        io.emit("mqtt_message", {
            topic: incomingTopic,
            payload,
            createdAt: new Date().toISOString(),
        });
    });

    client.on("error", (err) => {
        console.error("❌ MQTT error:", err.message);
    });
};

export default initMQTT;
