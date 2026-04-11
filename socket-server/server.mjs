import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});


// 🔥 SOCKET LOGIC
io.on("connection", (socket) => {
  console.log("🟢 Connected:", socket.id);

  // ✅ Join channel room
  socket.on("join_channel", (channelId) => {
    socket.join(channelId);
    console.log(`User ${socket.id} joined ${channelId}`);
  });

  // ❌ DO NOT handle send_message here (IMPORTANT)

  socket.on("disconnect", () => {
    console.log("🔴 Disconnected:", socket.id);
  });
});


// 🌐 Health check
app.get("/", (req, res) => {
  res.send("Socket server running 🚀");
});


// 🚀 Start server
const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`🚀 Socket server running on port ${PORT}`);
});