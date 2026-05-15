# NexSyncHub 🚀

![NexSyncHub Banner](https://via.placeholder.com/1200x400/090B14/4F46E5?text=NexSyncHub+-+Next-Gen+Collaboration)

**NexSyncHub** is a modern, real-time workspace collaboration and communication platform designed to bring teams closer together. Built with a focus on seamless UI/UX, robust performance, and powerful productivity tools, NexSyncHub bridges the gap between chat, file sharing, and task management.

## ✨ Key Features

- **💬 Real-Time Messaging:** Lightning-fast chat powered by Socket.io with typing indicators and online presence.
- **🏢 Workspace Management:** Create distinct workspaces and organize your team into channels.
- **🔐 Role-Based Access Control:** Secure environments with Owner, Admin, and Member permissions.
- **😄 Message Reactions:** React to messages with emojis. Includes interactive, WhatsApp-style hover tooltips to see exactly who reacted!
- **📎 Rich File Attachments:** Share images, videos, and documents seamlessly within chats.
- **✅ Convert to Task:** Instantly turn any message into an actionable task with priority levels and assignees.
- **🔗 Smart Invite System:** Generate invite links with beautiful, custom toast notifications and smooth redirects for existing members.
- **🎨 Next-Level UI/UX:** A gorgeous, glassmorphic design featuring deep-space glowing backgrounds, animated cards, and responsive grids.

## 🛠️ Tech Stack

**Frontend:**
- [Next.js](https://nextjs.org/) (App Router)
- [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide React](https://lucide.dev/) (Icons)

**Backend:**
- Next.js API Routes
- [Socket.io](https://socket.io/) (Real-time WebSockets)
- [NextAuth.js](https://next-auth.js.org/) (Authentication)

**Database & Storage:**
- [MongoDB](https://www.mongodb.com/) & [Mongoose](https://mongoosejs.com/)
- Custom Cloud Storage Integration for file uploads

## 🚀 Getting Started

### Prerequisites
Make sure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Git](https://git-scm.com/)
- A MongoDB Database (Local or MongoDB Atlas)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/nexsynchub.git
   cd nexsynchub
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or yarn install
   # or pnpm install
   ```

3. **Set up environment variables:**
   Create a `.env` or `.env.local` file in the root directory and add the following variables:
   ```env
   NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
   MONGODB_URI=your_mongodb_connection_string
   NEXTAUTH_SECRET=your_super_secret_key
   NEXTAUTH_URL=http://localhost:3000
   # Add any other required API keys (e.g., Cloud Storage, OAuth Providers)
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   # or yarn dev
   # or pnpm dev
   ```

5. **Open the app:**
   Navigate to http://localhost:3000 in your browser.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
Feel free to check the issues page.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---
*Crafted with ❤️ for seamless team collaboration.*