import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { BoardOrientation } from "react-chessboard/dist/chessboard/types";

function ChessGame() {
  const [game, setGame] = useState(new Chess());
  const [gameId, setGameId] = useState<string>("");
  const [socketConnected, setSocketConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const prevGameState = useRef<string>(new Chess().fen()); // FEN position of the previous game state
  const playerColor = useRef<BoardOrientation>("white");

  useEffect(() => {
    socketRef.current = io("http://localhost:3001");

    const socket = socketRef.current;

    socket.on("gameCreated", (gameID) => {
      setSocketConnected(true);
      setGameId(gameID);
      console.log("Created and joined to a game:", gameID);
    });

    socket.on("createError", (message) => {
      console.log("[Server] Create error:", message);
    });

    socket.on("joined", (response) => {
      setSocketConnected(true);
      playerColor.current = response.color;
      const updatedGame = new Chess(response.fen);
      setGame(updatedGame);
      setGameId(response.gameId);
      console.log("Joined to a game:", response.gameId);
    });

    socket.on("joinError", (message) => {
      console.log("[Server] Join error:", message);
    });

    socket.on("moveMade", (response) => {
      console.log("Move approved from the server with response:", response);
      const updatedGame = new Chess(response.fen);
      setGame(updatedGame);
    });

    socket.on("invalidMove", (message) => {
      console.log("[Server] Invalid move:", message);
      const updatedGame = new Chess(prevGameState.current);
      setGame(updatedGame);
    });

    console.log("Use effect trigerred...");

    return () => {
      socket.off("gameCreated");
      socket.off("createError");
      socket.off("moveMade");
      socket.off("invalidMove");
      socket.disconnect();
    };
  }, []);

  const handleMove = (sourceSquare: string, targetSquare: string): boolean => {
    const move = {
      from: sourceSquare,
      to: targetSquare,
      promotion: "q",
    };
    prevGameState.current = game.fen();
    const updatedGame = new Chess(game.fen());

    try {
      const result = updatedGame.move(move);
      console.log("Making move:", result);

      setGame(updatedGame);
      socketRef.current?.emit("makeMove", move);
      return true;
    } catch (err) {
      console.warn("You tried to make an illegal move:", move);
    }

    return false;
  };

  const handleGameCreation = () => {
    playerColor.current = "white";
    socketRef.current?.emit("createGame", playerColor.current);
    console.log("Sending request to server...");
  };

  const handleGameJoin = () => {
    playerColor.current = "white";
    socketRef.current?.emit("joinGame", "game9");
    console.log("Sending request to server...");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-3xl font-bold mb-4">Real-Time Chess Game</h1>
      <div className="w-full max-w-md">
        <Chessboard
          position={game.fen()}
          onPieceDrop={handleMove}
          autoPromoteToQueen={true}
          boardOrientation={playerColor.current}
        />
      </div>
      <div className="mt-4 text-sm">
        {socketConnected ? `Connected to game ${gameId}` : "Connecting..."}
      </div>
      <button
        className="bg-gray-700 p-3 rounded mt-5"
        onClick={handleGameCreation}
      >
        Create and join to a game
      </button>
      <button className="bg-gray-700 p-3 rounded mt-5" onClick={handleGameJoin}>
        Join game
      </button>
    </div>
  );
}

export default ChessGame;
