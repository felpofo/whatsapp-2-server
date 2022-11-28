import express from "express";
import http from "http";
import cors from "cors";
import { v4 as uuid } from "uuid";
import { Server } from "socket.io";
import { Message, User, MyServer } from "./types";
import { sortUsers } from "./utils";
import { routes } from "./routes";

let messages: Message[] = [];
let users: User[] = [];

const PORT = process.env.PORT ?? 3001;
const app = express();

app.use(cors());
app.use(routes);

const server = http.createServer(app);
const io: MyServer = new Server(server, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  socket.emit("onlineUsers", users);
  socket.emit("allMessages", messages);

  socket.on("setName", (name, previousId) => {
    socket.data.name = name;

    users.push({ id: socket.id, name });
    users = sortUsers(users);

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
    io.emit("onlineUsers", users);
  });
});

server.listen(PORT, () => console.log("running on port " + PORT));
