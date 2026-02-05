import Image from "next/image";
import { riotEndpoints } from "../lib/endpoints";

type MatchHistoryProps = {
  puuid: string;
  matches: any[];
};

export default function MatchHistory({ puuid, matches }: MatchHistoryProps) {
  return (
    <div className="space-y-4">
      {matches.map((match) => {
        const participant = match.info.participants.find(
          (p: any) => p.puuid === puuid,
        );

        console.log(participant);
        return (
          <div
            key={match.metadata.matchId}
            className={`flex justify-between p-4 rounded-lg border
              ${participant.win ? "bg-green-950/40 border-green-700" : "bg-red-950/40 border-red-700"}`}
          >
            <div>
              <p className="font-semibold">{participant.championName}</p>
              <Image
                src={riotEndpoints.championIcon(
                  participant.championName,
                  match.info.gameVersion,
                )}
                alt={participant.championName}
                width={50}
                height={50}
              />
              <p className="text-sm text-gray-400">
                {participant.kills}/{participant.deaths}/{participant.assists}
              </p>
            </div>
            <span className="text-xs text-gray-400">
              {Math.floor(match.info.gameDuration / 60)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
