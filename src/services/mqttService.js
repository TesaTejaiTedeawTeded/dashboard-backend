import mqtt from "mqtt";
import Message from "../models/Message.js";

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
