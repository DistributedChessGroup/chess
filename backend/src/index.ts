import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { MoveRequestDTO, MoveResFinnishDTO, MoveResponseDTO } from "./game.dto";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

app.use(cors());

const validateMove = () => {
  // TODO - Add validation
  return true;
};

const checkDraw = () => {
  // TODO - Add draw checking
  return false;
};

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("joinGame", (gameId: string) => {
    socket.join(gameId);
    console.log(`User ${socket.id} joined game ${gameId}`);
  });

  socket.on("move", (moveReqStr: string) => {
    const moveReq: MoveRequestDTO & { gameId: string } = JSON.parse(moveReqStr);
    console.log("Move requested", moveReq);

    let valid = false;
    if (validateMove()) {
      valid = true;

      // TODO - actually calculate new state
      let gameState = moveReq.after
      let finish: MoveResFinnishDTO = { winner: null };
      
      if (moveReq.san[moveReq.san.length - 1] === "#") {
        // Mate
        finish = { winner: moveReq.player.toUpperCase() as "W" | "B" };
      } else if (checkDraw()) {
        // Draw
        finish = { winner: null };
      }

      const moveRes: MoveResponseDTO = {
        valid,
        gameState,
        finish
      };

      io.to(moveReq.gameId).emit("move", JSON.stringify(moveRes));
      console.log("Move broadcasted to room:", moveReq.gameId, moveRes);
    }
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
