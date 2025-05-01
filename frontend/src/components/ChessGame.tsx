import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Chessboard } from "react-chessboard";
import useGame from "../hooks/useGame";
import { MoveDTO } from "../game.dto";

function ChessGame() {
  const {game} = useGame()
  const [fen, setFen] = useState(game.fen());
  const [socketConnected, setSocketConnected] = useState(false);
  const socket = useRef<Socket | null>(null)

  useEffect(() => {
    socket.current = io("http://localhost:3001")
    socket.current.on("connect", () => {
      setSocketConnected(true);
    });

    socket.current.on(
      "move",
      (move: { from: string; to: string; promotion?: string }) => {
        game.move(move);
        setFen(game.fen());
      },
    );

    return () => {
      socket.current?.disconnect();
    };
  }, [game]);

  const handleMove = (move: { from: string; to: string }): boolean => {
    const result = game.move({
      from: move.from,
      to: move.to,
      promotion: "q",
    });

    if (result) {
      setFen(game.fen());

      const moveDto: MoveDTO = {
        player: result.color,
        before: result.before,
        after: result.after,
        san: result.san,
        from: result.from,
        to: result.to,
      }

      console.log('move -> backend: ', result, moveDto)
      socket.current?.emit("move", JSON.stringify(moveDto));
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
