import mongoose from "mongoose";

const defensiveSchema = new mongoose.Schema(
    {
        cameraId: { type: String, required: true },
        lat: { type: Number },
        long: { type: Number },
        alt: { type: Number },
        imageUrl: { type: String }, // /uploads/file.jpg
        detectedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

export default mongoose.model("Defensive", defensiveSchema);
