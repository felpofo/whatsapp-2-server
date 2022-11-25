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
const PORT = process.env.PORT ?? 3001;
const app = (0, express_1.default)();
app.set("port", PORT);
app.use((0, cors_1.default)());
app.get("/", (_, res) => res.send("OK"));
const server = http_1.default.createServer(app);
let messages = [];
let users = [];
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
function sortUsers() {
    users = users.sort((user1, user2) => {
        const a = user1.name.toUpperCase();
        const b = user2.name.toUpperCase();
        if (a < b)
            return -1;
        if (a > b)
            return 1;
        return 0;
    });
}
io.on("connection", (socket) => {
    socket.emit("onlineUsers", users);
    socket.emit("allMessages", messages);
    socket.on("setName", (name, previousId) => {
        if (socket.data.name)
            return;
        socket.data.name = name;
        users.push({ id: socket.id, name });
        sortUsers();
        io.emit("onlineUsers", users);
        if (previousId) {
            messages = messages.map(message => {
                if (message.user.id !== previousId)
                    return message;
                const newMessage = message;
                newMessage.user.id = socket.id;
                return newMessage;
            });
            io.emit("allMessages", messages);
        }
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
        messages.push(message);
        io.emit("message", message);
    });
    socket.on("deleteMessage", id => {
        messages = messages.filter(message => message.id !== id && message);
        io.emit("deleteMessage", id);
    });
    socket.on("disconnect", () => {
        users = users.filter(user => user.id !== socket.id && user);
    });
});
server.listen(PORT, () => console.log("online on port " + PORT));
