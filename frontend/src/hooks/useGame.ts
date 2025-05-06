import { Chess } from "chess.js";
import { useState } from "react";

const useGame = () => {
  const [game, setGame] = useState(new Chess());

  return {game}
}

export default useGame;
