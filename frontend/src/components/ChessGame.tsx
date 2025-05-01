import React, { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

let socket: Socket;

function ChessGame() {
  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState(game.fen());
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    socket = io("http://localhost:3001");

    socket.on("connect", () => {
      setSocketConnected(true);
    });

    socket.on(
      "move",
      (move: { from: string; to: string; promotion?: string }) => {
        const newGame = new Chess(game.fen());
        newGame.move(move);
        setGame(newGame);
        setFen(newGame.fen());
      },
    );

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleMove = (move: { from: string; to: string }): boolean => {
    const newGame = new Chess(game.fen());
    const result = newGame.move({
      from: move.from,
      to: move.to,
      promotion: "q",
    });

    if (result) {
      setGame(newGame);
      setFen(newGame.fen());
      socket.emit("move", { from: move.from, to: move.to, promotion: "q" });
      return true;
    }

    return false;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-3xl font-bold mb-4">Real-Time Chess Game</h1>
      <div className="w-full max-w-md">
        <Chessboard
          position={fen}
          onPieceDrop={(sourceSquare, targetSquare) => {
            const result = handleMove({ from: sourceSquare, to: targetSquare });
            return result;
          }}
        />
      </div>
      <div className="mt-4 text-sm">
        {socketConnected ? "Connected to server" : "Connecting..."}
      </div>
    </div>
  );
}

export default ChessGame;
