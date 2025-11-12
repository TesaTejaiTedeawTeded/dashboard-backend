import mongoose from "mongoose";

const offensiveSchema = new mongoose.Schema({
    droneId: { type: String, required: true },
    lat: { type: Number, required: true },
    long: { type: Number, required: true },
    alt: { type: Number },
    timestamp: { type: Date, default: Date.now },
});

export default mongoose.model("Offensive", offensiveSchema);
