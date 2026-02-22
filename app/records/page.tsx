import { getMatchRecords, getPentakillEvents } from "@/app/lib/db";
import { getDdragonVersion } from "@/app/lib/service";
import { users } from "@/app/data/users";
import RecordsGrid from "@/app/components/records/RecordsGrid";

export const revalidate = 900;

export default async function RecordsPage() {
  const puuids = users.map((u) => u.puuid);

  const [records, pentakills, version] = await Promise.all([
    getMatchRecords(puuids),
    getPentakillEvents(puuids),
    getDdragonVersion(),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100">Records</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Best individual game performances across all {users.length} players this season.
        </p>
      </div>
      <RecordsGrid records={records} pentakills={pentakills} version={version} />
    </main>
  );
}
