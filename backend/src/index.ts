import express from "express";
import http from "http";
import { Server } from "socket.io";
import { Chess } from "chess.js";
import { MoveRequestDTO, MoveResponseDTO } from "./game.dto";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
  },
});

interface Game {
  game: Chess;
  white: string; // socket id of the white player (empty strings means there is no player in that color joined);
  black: string; // socket id of the black player
  end: boolean; // tracks if the game has ended
}

// the key (string) is a game id in the format: game1, game2, ...
const games: Record<string, Game> = {};
let numOfGames = 0;

io.on("connection", (socket) => {
  console.log(`User with socket id: ${socket.id} connected to the server`);

  // Create a new game; client should choose a color that they want to have
  socket.on("createGame", (color) => {
    const gameId = "game" + numOfGames++;
    if (color !== "white" && color !== "black") {
      socket.emit("createError", "Wrong player color was given");
      return;
    }
    const newGame = {
      game: new Chess(),
      white: color === "white" ? socket.id : "",
      black: color === "black" ? socket.id : "",
      end: false,
    };
    games[gameId] = newGame;
    console.log(
      `User ${socket.id} created a game: ${newGame} with id: ${gameId}`,
    );

    socket.data.color = color;
    socket.data.gameId = gameId;

    // Notify the player on successful creation and join the game
    socket.emit("gameCreated", gameId);
    socket.join(gameId);
  });

  // Join to a game but only if there is only one player in the game
  socket.on("joinGame", (gameId: string) => {
    // Find a game to join
    const game = games[gameId];
    if (!game) {
      socket.emit("joinError", `Game '${gameId}' not found.`);
      return;
    }

    // Count the number of players in the game
    const playerCount = [game.white, game.black].filter(Boolean).length;

    // Cannot join if there are already 2 players (or 0 players)
    if (playerCount !== 1) {
      if (playerCount === 0) {
        socket.emit(
          "joinError",
          "ERROR: Game has 0 players and should have been already deleted",
        );
        return;
      } else if (playerCount >= 2) {
        socket.emit("joinError", "Game already has 2 players.");
        return;
      }
    }

    // Assign player to white/black
    if (!game.white) {
      game.white = socket.id;
      socket.data.color = "white";
    } else {
      game.black = socket.id;
      socket.data.color = "black";
    }

    // Joint the Socket.io room and send reply to the client - later we will broadcast moves to the room
    socket.join(gameId);
    socket.emit("joined", {
      color: socket.data.color,
      fen: game.game.fen(),
      gameId: gameId,
    });
    socket.data.gameId = gameId;

    console.log(`User ${socket.id} joined game ${gameId}`);
  });

  socket.on("makeMove", (moveReq: MoveRequestDTO) => {
    const game = games[socket.data.gameId];
    const gameId = socket.data.gameId;

    // The socket doesn't belong to any game
    if (!game) {
      socket.emit(
        "invalidMove",
        "The player socket doesn't belong to any games",
      );
      return;
    }
    // This prevents some weird bugs if the game deletion was not handled properly
    if (game.white !== socket.id && game.black !== socket.id) {
      console.log("Bug: sockets");
      socket.emit("invalidMove", "There was an error (bug) on the server");
      return;
    }
    // If the game has already ended, don't make a move
    if (game.end) {
      socket.emit("invalidMove", "The game has already ended");
      return;
    }

    let result = null;
    try {
      const currentTurn = game.game.turn() === "w" ? "white" : "black";
      if (currentTurn !== socket.data.color) {
        socket.emit(
          "invalidMove",
          `It is ${currentTurn}'s turn - not ${socket.data.color}'s `,
        );
        return;
      }

      // Attempt to make the move
      result = game.game.move(moveReq);
      if (!result) {
        socket.emit("invalidMove", "Illegal move: " + JSON.stringify(result));
        return;
      }
    } catch (err) {
      console.log("Invalid move");
    }

    // Handle the end of the game
    let finish: "" | "white" | "black" | "draw" = "";
    if (result.san[result.san.length - 1] === "#") {
      // Mate
      finish = socket.data.color as "white" | "black";
    } else if (false) {
      // Draw
      finish = "draw";
    }

    const response: MoveResponseDTO = {
      fen: game.game.fen(),
      finish: finish,
    };

    io.to(gameId).emit("moveMade", response);
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);

    const gameId = socket.data.gameId;
    const color: "white" | "black" = socket.data.color;
    if (!gameId || !color) return;

    const game = games[gameId];
    if (!game) return;

    game[color] = "";

    // If there is no other player in the game, delete it
    if (!game.white && !game.black) {
      // delete the game
      delete games[gameId];
      console.log(`Game ${gameId} deleted — no players left.`);
    }
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
