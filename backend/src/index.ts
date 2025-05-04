import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { MoveRequestDTO, MoveResFinnishDTO, MoveResponseDTO } from "./game.dto";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Adjust to your frontend port
    methods: ["GET", "POST"],
  },
});

app.use(cors());

const validateMove = () => {
  // TODO - Add validation
  return true;
}

const checkDraw = () => {
  // TODO - Add draw checking
  return true;
}

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("move", (moveReqStr: string) => {

    const moveReq: MoveRequestDTO = JSON.parse(moveReqStr)
    console.log("Move requested ", moveReq);

    // Validation
    if (validateMove()) {
      let finish: MoveResFinnishDTO | undefined;

      if (moveReq.san[moveReq.san.length-1] === "#") {

        // Mate
        finish = {
          winner: moveReq.player.toUpperCase() as ("W" | "B")
        }

      }
      else if(checkDraw()) {
        finish = {
          winner: null
        }
      }

      const moveRes: MoveResponseDTO = {
        ...moveReq,
        finish: finish
      }

      socket.broadcast.emit("move", JSON.stringify(moveRes));
      
      console.log("Move responded: ", moveRes);
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
