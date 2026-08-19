export type PlayerRow = {
  id: string;
  full_name: string;
  jersey_number: number;
  position: "GK" | "DF" | "MF" | "FW";
  position_detail: string | null;
  photo_url: string | null;
  is_active: boolean;
};

export type MatchRow = {
  id: string;
  opponent: string;
  match_date: string;
  kickoff_time: string | null;
  venue: string;
  competition: string;
  is_home: boolean;
  goals_for: number | null;
  goals_against: number | null;
  formation: string;
  status: "scheduled" | "played" | "cancelled";
  slug: string;
  is_featured: boolean;
  mvp_player_id: string | null;
  mvp_avg_rating: number | null;
  mvp_vote_count: number | null;
  mvp_published_at: string | null;
};

export type SquadPlayer = {
  id: string;
  is_starter: boolean;
  pitch_slot: string | null;
  bench_order: number | null;
  player: PlayerRow;
  avg_rating: number | null;
  vote_count: number;
};

export type MatchMvp = {
  player: PlayerRow;
  avg_rating: number;
  vote_count: number;
  published_at: string;
};

export type MatchDisplay = MatchRow & {
  squad: SquadPlayer[];
  mvp: MatchMvp | null;
};
