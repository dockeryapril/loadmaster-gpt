export interface HistoryItem {
  id: string;
  miles: number;
  offerAllIn: number;
  weightLbs?: number;
  pickupInHours?: number;
  weekend?: boolean;
  targetAllIn: number;
  anchorAllIn: number;
  floorAllIn: number;
  premiums: string[];
  strategy: string;
  timestamp: number;
  // Optional fields for Pro migration
  outcome?: 'pending' | 'accepted' | 'countered' | 'declined';
  finalAllIn?: number;
}