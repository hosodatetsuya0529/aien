// prisma/snapshot/*.json（SQLiteからの実データ書き出し）を Postgres(Neon) へ流し込む。
// 使い方: .env に DATABASE_URL / DIRECT_URL（Neon）を設定 → `npm run db:push` → `tsx prisma/import-snapshot.ts`
// 冪等（再実行で全消し→再投入）。
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

process.loadEnvFile(); // Node 24: .env を自動読込
const prisma = new PrismaClient();

const load = (name: string): Record<string, unknown>[] =>
  JSON.parse(readFileSync(new URL(`./snapshot/${name}.json`, import.meta.url), "utf8"));

// createdAt は SQLite で ms整数。Postgres の DateTime 用に Date へ変換。
const withDates = (rows: Record<string, unknown>[]) =>
  rows.map((r) => (typeof r.createdAt === "number" ? { ...r, createdAt: new Date(r.createdAt) } : r));

async function main() {
  // 子→親の順で全消し（冪等化）
  await prisma.like.deleteMany();
  await prisma.workEntry.deleteMany();
  await prisma.rankingEntry.deleteMany();
  await prisma.work.deleteMany();
  await prisma.workRanking.deleteMany();
  await prisma.talent.deleteMany();
  await prisma.ranking.deleteMany();

  // 親→子の順で投入
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = (n: string) => withDates(load(n)) as any;
  await prisma.talent.createMany({ data: d("Talent") });
  await prisma.work.createMany({ data: d("Work") });
  await prisma.workRanking.createMany({ data: d("WorkRanking") });
  await prisma.ranking.createMany({ data: d("Ranking") });
  await prisma.workEntry.createMany({ data: load("WorkEntry") as any });
  await prisma.rankingEntry.createMany({ data: load("RankingEntry") as any });
  await prisma.like.createMany({ data: d("Like") });

  const [w, wr, we] = await Promise.all([
    prisma.work.count(),
    prisma.workRanking.count(),
    prisma.workEntry.count(),
  ]);
  console.log(`✅ Neonへ投入完了: Work=${w} / WorkRanking=${wr} / WorkEntry=${we}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
