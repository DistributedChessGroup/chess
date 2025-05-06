export interface MoveDTO {
  player: string;
  before: string;
  after: string;
  san: string;
  from: string;
  to: string;
  promotion?: string
}
