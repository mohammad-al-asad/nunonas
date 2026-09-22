/* eslint-disable @typescript-eslint/no-require-imports */
const http = require("http");
const { Server } = require("socket.io");

const port = Number(process.env.SOCKET_PORT || 3001);
const server = http.createServer();

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  socket.on("support:message", (payload) => {
    const now = new Date();
    const time = payload?.time ?? now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    io.emit("support:message", {
      ticketId: payload?.ticketId,
      sender: payload?.sender ?? "user",
      name: payload?.name,
      message: payload?.message,
      time
    });
  });
});

server.listen(port, () => {
  console.log(`Socket.IO server listening on http://localhost:${port}`);
});
