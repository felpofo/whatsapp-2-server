import express from "express";
import http from "http";
import cors from "cors";
import { v4 as uuid } from "uuid";
import { Server } from "socket.io";

import { ServerToClientEvents, ClientToServerEvents, InterServerEvents, SocketData, Message, User } from "./types";

const PORT = process.env.PORT ?? 3001;
const app = express();
app.set("port", PORT);
app.use(cors());

app.get("/", (_, res) => res.send("OK"));

const server = http.createServer(app);

let messages: Message[] = [];
let users: User[] = [];

const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

function sortUsers() {
  users = users.sort((user1: User, user2: User) => {
    const a = user1.name.toUpperCase();
    const b = user2.name.toUpperCase();

    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  });
}

io.on("connection", (socket) => {
  socket.emit("onlineUsers", users);
  socket.emit("allMessages", messages);

  socket.on("setName", (name, previousId) => {
    if (socket.data.name) return;

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
    const message: Message = {
      id: uuid(),
      time: Date.now(),
      user: {
        id: socket.id,
        name: socket.data.name as string
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
