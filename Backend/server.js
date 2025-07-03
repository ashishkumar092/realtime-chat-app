const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // For development only — restrict in production
    methods: ["GET", "POST"]
  }
});

const users = {}; // { socket.id: { username, room } }

io.on("connection", (socket) => {
  console.log(`✅ User connected: ${socket.id}`);

  // Join Room
  socket.on("join_room", ({ username, room }) => {
    users[socket.id] = { username, room };
    socket.join(room);

    // Send updated users list to the room
    const roomUsers = Object.values(users).filter((u) => u.room === room);
    io.to(room).emit("room_users", roomUsers);

    console.log(`${username} joined room ${room}`);
  });

  // Send Message to Room
  socket.on("send_message", (data) => {
    const user = users[socket.id];
    if (user) {
      // io.to(user.room).emit("receive_message", data);
      io.in(user.room).emit("receive_message", data); // Emit only to the same room
    }
  });

  // Typing indicator
  socket.on("user_typing", ({ username, room }) => {
    socket.to(room).emit("user_typing", { username });
  });

  // socket.on("user_stop_typing", ({ room }) => {
  //   const user = users[socket.id];
  //   if (user) {
  //     socket.to(room).emit("user_stop_typing", { username: user.username });
  //   }
  // });

  // Disconnect
  socket.on("disconnect", () => {
    const user = users[socket.id];
    if (user) {
      const room = user.room;
      delete users[socket.id];

      // Notify updated user list
      const roomUsers = Object.values(users).filter((u) => u.room === room);
      io.to(room).emit("room_users", roomUsers);

      console.log(`❌ ${user.username} left room ${room}`);
    }

    console.log(`User disconnected: ${socket.id}`);
  });
});

server.listen(3001, () => {
  console.log("🚀 Server running on http://localhost:3001");
});
