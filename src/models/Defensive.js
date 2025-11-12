import mongoose from "mongoose";

const defensiveSchema = new mongoose.Schema(
    {
        cameraId: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        camLat: { type: Number },
        camLong: { type: Number },
        imagePath: { type: String },
        objects: {
            type: [
                new mongoose.Schema(
                    {
                        objId: { type: String, required: true },
                        lat: { type: Number },
                        long: { type: Number },
                        alt: { type: Number },
                    },
                    { _id: false }
                ),
            ],
            default: [],
        },
    },
    { timestamps: true }
);

export default mongoose.model("Defensive", defensiveSchema);
