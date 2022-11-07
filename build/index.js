"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const uuid_1 = require("uuid");
const socket_io_1 = require("socket.io");
const PORT = process.env.PORT ?? 3000;
const app = (0, express_1.default)();
app.set("port", PORT);
app.use((0, cors_1.default)());
const server = http_1.default.createServer(app);
const messages = new Set();
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
io.on("connection", (socket) => {
    socket.emit("previousMessages", (() => {
        const parsedMessages = {};
        messages.forEach(message => {
            parsedMessages[message.id] = message;
        });
        return parsedMessages;
    })());
    socket.on("setName", name => {
        socket.data.name = name;
    });
    socket.on("message", text => {
        const message = {
            id: (0, uuid_1.v4)(),
            time: Date.now(),
            user: {
                id: socket.id,
                name: socket.data.name
            },
            value: text
        };
        messages.add(message);
        io.emit("message", message);
    });
    socket.on("deleteMessage", id => {
        messages.forEach(message => {
            if (message.id == id)
                messages.delete(message);
        });
        io.emit("deleteMessage", id);
    });
});
server.listen(PORT);
