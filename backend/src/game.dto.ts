export interface MoveRequestDTO {
  player: string;
  before: string;
  after: string;
  san: string;
  from: string;
  to: string;
  promotion?: string
}

export interface MoveResFinnishDTO {
  winner: "W" | "B" | null
}

export interface MoveResponseDTO {
  player: "W" | "B";
  before: string;
  after: string;
  san: string;
  from: string;
  to: string;
  promotion?: string;
  finish?: MoveResFinnishDTO
}