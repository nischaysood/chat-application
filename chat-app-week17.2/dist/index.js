"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const wss = new ws_1.WebSocketServer({ port: 8080 });
let allSockets = [];
wss.on("connection", (socket) => {
    socket.on("message", (message) => {
        try {
            const parsedMessage = JSON.parse(message.toString());
            if (parsedMessage.type === "join") {
                allSockets.push({
                    socket,
                    room: parsedMessage.payload.roomId,
                    id: parsedMessage.payload.senderId, // Assign senderId
                });
            }
            if (parsedMessage.type === "chat") {
                const sender = allSockets.find((user) => user.socket === socket);
                if (!sender)
                    return;
                const { message, senderId } = parsedMessage.payload;
                allSockets.forEach((user) => {
                    if (user.room === sender.room && user.socket !== socket) {
                        user.socket.send(JSON.stringify({ text: message, senderId }));
                    }
                });
            }
        }
        catch (error) {
            console.error("Invalid message format:", error);
        }
    });
    socket.on("close", () => {
        allSockets = allSockets.filter((user) => user.socket !== socket);
    });
});
console.log("WebSocket server is running on ws://localhost:8080");
