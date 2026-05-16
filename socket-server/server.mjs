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

// 🔥 Workspace presence store
const workspacePresence = new Map();

// ✅ SOCKET CONNECTION
io.on("connection", (socket) => {

    console.log("Connected:", socket.id);

    // 🔥 Join chat channel
    socket.on("join_channel", (channelId) => {
        socket.join(channelId);
    });

    // 🔥 Workspace presence
    socket.on(
        "join_workspace_presence",
        ({ workspaceId, userId }) => {

            // Join workspace room
            socket.join(workspaceId);

            // Create workspace map if missing
            if (!workspacePresence.has(workspaceId)) {
                workspacePresence.set(
                    workspaceId,
                    new Map()
                );
            }

            const workspaceUsers =
                workspacePresence.get(workspaceId);

            // Store user socket
            workspaceUsers.set(userId, socket.id);

            // Save metadata for disconnect cleanup
            socket.data.workspaceId = workspaceId;
            socket.data.userId = userId;

            // Emit updated online users
            io.to(workspaceId).emit(
                "workspace_online_users",
                Array.from(workspaceUsers.keys())
            );

            console.log(
                `User ${userId} joined workspace ${workspaceId}`
            );
        }
    );

    // 🔥 Typing start
    socket.on(
        "typing_start",
        ({ channelId, user }) => {

            socket.to(channelId).emit(
                "user_typing",
                {
                    user,
                    channelId,
                }
            );

        }
    );

    // 🔥 Typing stop
    socket.on(
        "typing_stop",
        ({ channelId, user }) => {

            socket.to(channelId).emit(
                "user_stop_typing",
                {
                    user,
                    channelId,
                }
            );

        }
    );

    // 🔥 Admin realtime audits
    socket.on(
        "join_admin_global",
        () => {

            socket.join(
                "admin_global"
            );

        }
    );

    // 🔥 Disconnect
    socket.on("disconnect", () => {

        console.log("Disconnected:", socket.id);

        const workspaceId = socket.data.workspaceId;
        const userId = socket.data.userId;

        if (!workspaceId || !userId) return;

        const workspaceUsers =
            workspacePresence.get(workspaceId);

        if (!workspaceUsers) return;

        // Remove disconnected user
        workspaceUsers.delete(userId);

        // Remove workspace if empty
        if (workspaceUsers.size === 0) {
            workspacePresence.delete(workspaceId);
        }

        // Emit updated online users
        io.to(workspaceId).emit(
            "workspace_online_users",
            Array.from(workspaceUsers.keys())
        );

        console.log(
            `User ${userId} left workspace ${workspaceId}`
        );
    });

});


// ✅ INTERNAL EMIT API
app.post("/emit", (req, res) => {

    const { channelId, event, data, message } = req.body;

    if (!channelId) {
        return res.status(400).json({
            error: "channelId required"
        });
    }

    // ✅ Flexible events
    if (event) {
        io.to(channelId).emit(event, data);
    }

    // ✅ Backward compatible message event
    if (message) {
        io.to(channelId).emit(
            "receive_message",
            message
        );
    }

    res.json({ success: true });

});


server.listen(4000, () => {
    console.log("Socket server running on port 4000");
});