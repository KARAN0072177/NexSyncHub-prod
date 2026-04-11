import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
    },
});


// ✅ SOCKET CONNECTION
io.on("connection", (socket) => {
    console.log("Connected:", socket.id);

    socket.on("join_channel", (channelId) => {
        socket.join(channelId);
    });

    socket.on("disconnect", () => {
        console.log("Disconnected:", socket.id);
    });

    // 🔥 Typing start
    socket.on("typing_start", ({ channelId, user }) => {
        socket.to(channelId).emit("user_typing", user);
    });

    // 🔥 Typing stop
    socket.on("typing_stop", ({ channelId, user }) => {
        socket.to(channelId).emit("user_stop_typing", user);
    });

});


// ✅ INTERNAL EMIT API (VERY IMPORTANT)        old backup logic for reference, in case we want to revert back to a simpler emit structure without custom events and data payloads
// app.post("/emit", (req, res) => {
//     const { channelId, message } = req.body;

//     if (!channelId || !message) {
//         return res.status(400).json({ error: "Invalid data" });
//     }

//     io.to(channelId).emit("receive_message", message);

//     res.json({ success: true });
// });

app.post("/emit", (req, res) => {
  const { channelId, event, data, message } = req.body;

  if (!channelId) {
    return res.status(400).json({ error: "channelId required" });
  }

  // ✅ Handle NEW flexible events
  if (event) {
    io.to(channelId).emit(event, data);
  }

  // ✅ Handle OLD message format (BACKWARD COMPATIBLE)
  if (message) {
    io.to(channelId).emit("receive_message", message);
  }

  res.json({ success: true });
});


server.listen(4000, () => {
    console.log("Socket server running on port 4000");
});