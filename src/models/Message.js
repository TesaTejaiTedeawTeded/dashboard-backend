import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        topic: { type: String, required: true },
        payload: { type: String, required: true },
    },
    { timestamps: true }
);

export default mongoose.model("Message", messageSchema);
