import userRoutes from "./userRoutes.js";
import alertRoutesFactory from "./alertRoutes.js";
import messageRoutes from "./messageRoutes.js";

export const registerRoutes = (app, io) => {
    app.use("/api/auth", userRoutes);
    app.use("/api/messages", messageRoutes);
    if (io) {
        app.use("/api/alerts", alertRoutesFactory(io));
    }
    app.get("/", (req, res) => res.send("Backend running ✅"));
};

export default registerRoutes;
