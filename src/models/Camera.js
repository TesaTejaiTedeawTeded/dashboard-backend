import mongoose from "mongoose";

const cameraSchema = new mongoose.Schema(
    {
        cameraId: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
            default: "",
        },
    },
    { timestamps: true }
);

cameraSchema.index({ cameraId: 1 }, { unique: true });

export default mongoose.model("Camera", cameraSchema);
