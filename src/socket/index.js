export const registerSocketHandlers = (io) => {
    io.on("connection", (socket) => {
        console.log("🟢 Web client connected", socket.id);

        socket.on("disconnect", () => {
            console.log("🔻 Web client disconnected", socket.id);
        });
    });
};

export default registerSocketHandlers;
