import express from "express";
import http from "http";
import cors from "cors";
import { v4 as uuid } from "uuid";
import { Server } from "socket.io";

import { ServerToClientEvents, ClientToServerEvents, InterServerEvents, SocketData, Message } from "./types";

const PORT = process.env.PORT ?? 3000;
const app = express();
app.set("port", PORT);
app.use(cors());

app.get("/", (_, res) => res.send("OK"));

const server = http.createServer(app);

const messages: Set<Message> = new Set();
// const users = {};

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

io.on("connection", (socket) => {
  socket.emit("previousMessages", (() => {
    const parsedMessages: Record<string, Message> = {};

    messages.forEach(message => {
      parsedMessages[message.id] = message;
    });

    return parsedMessages;
  })());

  socket.on("setName", name => {
    socket.data.name = name;
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
