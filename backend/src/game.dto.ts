export interface MoveRequestDTO {
  from: string;
  to: string;
  promotion?: string;
}

export interface MoveResponseDTO {
  fen: string; // game state after making correct move
  finish: "" | "white" | "black" | "draw";
}
