import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ランキングへのグッド/バッド投票（プロトタイプ：端末ごとの重複防止は未実装）。
// body: { vote: "good"|"bad", prev: "good"|"bad"|null }
// prev を受け取り、付け替え/取り消しの差分を反映する。
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { vote, prev } = (await req.json()) as { vote: "good" | "bad"; prev: "good" | "bad" | null };
  if (vote !== "good" && vote !== "bad") {
    return NextResponse.json({ error: "invalid vote" }, { status: 400 });
  }

  const next = prev === vote ? null : vote; // 同じものを再度押したら取り消し
  let goodDelta = 0;
  let badDelta = 0;
  if (prev === "good") goodDelta -= 1;
  if (prev === "bad") badDelta -= 1;
  if (next === "good") goodDelta += 1;
  if (next === "bad") badDelta += 1;

  try {
    const r = await prisma.workRanking.update({
      where: { slug },
      data: { good: { increment: goodDelta }, bad: { increment: badDelta } },
      select: { good: true, bad: true },
    });
    return NextResponse.json({ good: r.good, bad: r.bad, choice: next });
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}
