import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { BoardOrientation } from "react-chessboard/dist/chessboard/types";
import toast, { Toaster } from "react-hot-toast";

type PlayerColor = "White" | "Black";

function ChessGame() {
  const [game, setGame] = useState(new Chess());
  const [gameId, setGameId] = useState<string>("");
  const [joinGameId, setJoinGameId] = useState<string>("");

  const [socketConnected, setSocketConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const prevGameState = useRef<string>(new Chess().fen());
  const playerColor = useRef<BoardOrientation>("white");

  const [currentPlayer, setCurrentPlayer] = useState<PlayerColor>("White");
  const [gameOverMessage, setGameOverMessage] = useState<string | null>(null);

  useEffect(() => {
    const turn = game.turn();

    if (turn === "w") {
      setCurrentPlayer("White");
    } else {
      setCurrentPlayer("Black");
    }
  }, [game]);

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
      toast.error(`Creating game failed: ${message}`);
    });

    socket.on("joined", (response) => {
      setSocketConnected(true);
      playerColor.current = response.color;
      const updatedGame = new Chess(response.fen);
      setGame(updatedGame);
      setGameId(response.gameId);
      console.log("Joined to a game:", response.gameId);
      if (updatedGame.isGameOver()) {
        if (updatedGame.isCheckmate()) {
          const winner = updatedGame.turn() === "w" ? "Black" : "White";
          setGameOverMessage(`${winner} wins by checkmate!`);
        } else {
          setGameOverMessage("Game drawn!");
        }
      }
    });

    socket.on("joinError", (message) => {
      console.log("[Server] Join error:", message);
      toast.error(`Join failed: ${message}`);
    });

    socket.on("moveMade", (response) => {
      console.log("Move approved from the server with response:", response);
      const updatedGame = new Chess(response.fen);
      setGame(updatedGame);

      if (response.finish === "white" || response.finish === "black") {
        setGameOverMessage(
          `${response.finish.charAt(0).toUpperCase() + response.finish.slice(1)} wins by checkmate!`,
        );
      } else if (response.finish === "draw") {
        setGameOverMessage("Game drawn!");
      }
    });

    socket.on("invalidMove", (message) => {
      console.log("[Server] Invalid move:", message);
      const updatedGame = new Chess(prevGameState.current);
      setGame(updatedGame);
      toast.error(`Invalid move: ${message}`);
    });

    return () => {
      socket.off("gameCreated");
      socket.off("createError");
      socket.off("moveMade");
      socket.off("invalidMove");
      socket.disconnect();
    };
  }, []);

  const handleMove = (sourceSquare: string, targetSquare: string): boolean => {
    if (gameOverMessage) return false;

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
    if (!joinGameId.trim()) {
      console.warn("Game ID input is empty.");
      return;
    }
    playerColor.current = "white";
    console.log("Attempting to join game:", joinGameId);
    socketRef.current?.emit("joinGame", joinGameId);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <Toaster position="top-center" />
      <h1 className="text-3xl font-bold mb-4">Real-Time Chess Game</h1>
      <div className="w-full max-w-md">
        {socketConnected && gameId && (
          <div>
            <Chessboard
              position={game.fen()}
              onPieceDrop={handleMove}
              autoPromoteToQueen={true}
              boardOrientation={playerColor.current}
            />
            <h2 className="text-xl mt-4 text-center">
              {gameOverMessage
                ? gameOverMessage
                : `It is ${currentPlayer}'s turn`}
            </h2>
          </div>
        )}
      </div>
      <div className="mt-3 text-m">
        {socketConnected && `Connected to game with id: ${gameId}`}
      </div>
      {!(socketConnected && gameId) && (
        <>
          <button
            className="bg-blue-600 hover:bg-blue-700 transition-colors p-3 rounded-lg shadow-md"
            onClick={handleGameCreation}
          >
            Create new game
          </button>
          <div className="flex mt-5 gap-3 items-center">
            <input
              type="text"
              className="p-2 rounded-lg bg-white text-black border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
              placeholder="Enter game ID"
              value={joinGameId}
              onChange={(e) => setJoinGameId(e.target.value)}
            />
            <button
              className="bg-green-600 hover:bg-green-700 transition-colors p-3 rounded-lg shadow-md"
              onClick={handleGameJoin}
            >
              Join game
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default ChessGame;
