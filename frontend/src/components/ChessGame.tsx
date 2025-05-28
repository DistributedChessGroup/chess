import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Chessboard } from "react-chessboard";
import useGame from "../hooks/useGame";
import { MoveDTO } from "../game.dto";
import { v4 as uuidv4 } from "uuid";

function ChessGame() {
  const { game } = useGame();
  const [fen, setFen] = useState(game.fen());
  const [socketConnected, setSocketConnected] = useState(false);
  const socket = useRef<Socket | null>(null);

  const gameId = useRef<string>(
    new URLSearchParams(window.location.search).get("gameId") || uuidv4()
  );

  useEffect(() => {
    socket.current = io("http://localhost:3001");

    socket.current.on("connect", () => {
      setSocketConnected(true);
      socket.current?.emit("joinGame", gameId.current);
    });

    socket.current.on("move", (moveStr: string) => {
      const move = JSON.parse(moveStr);
      console.log(move)
      
      const newFen = move.gameState;
      game.load(newFen);
      setFen(newFen);

      if (!move.valid) {
        console.log("MOVE INVALID")
        // if move was not valid -> display message -> toast.message()... whatever 
      }
      
    });

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

    console.log(result)

    if (result) {

      const moveDto: MoveDTO & { gameId: string } = {
        player: result.color,
        before: result.before,
        after: result.after,
        san: result.san,
        from: result.from,
        to: result.to,
        gameId: gameId.current,
      };

      console.log("move -> backend:", result, moveDto);
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
          onPieceDrop={(sourceSquare, targetSquare) =>
            handleMove({ from: sourceSquare, to: targetSquare })
          }
        />
      </div>
      <div className="mt-4 text-sm">
        {socketConnected ? `Connected to game ${gameId.current}` : "Connecting..."}
      </div>
    </div>
  );
}

export default ChessGame;
