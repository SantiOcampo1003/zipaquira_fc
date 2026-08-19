import { MatchLineupViewer } from "@/components/matches/MatchLineupViewer";
import { getMatchesForDisplay } from "@/lib/matches";

export async function MatchesSection() {
  const matches = await getMatchesForDisplay();

  if (!matches.length) return null;

  return <MatchLineupViewer matches={matches} />;
}
