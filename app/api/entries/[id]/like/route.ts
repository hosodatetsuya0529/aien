import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// いいね（端末ごと1エントリー1回）。いいねは表示順に反映される。
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const voterKey = body?.voterKey;
  if (typeof voterKey !== "string" || voterKey.length < 8) {
    return NextResponse.json({ error: "voterKey が不正" }, { status: 400 });
  }

  const entry = await prisma.rankingEntry.findUnique({ where: { id } });
  if (!entry) {
    return NextResponse.json({ error: "対象が見つかりません" }, { status: 404 });
  }

  try {
    await prisma.like.create({ data: { entryId: id, voterKey } });
  } catch {
    // 既にいいね済み（unique制約）→ そのまま現在値を返す
    return NextResponse.json({ likes: entry.likes, already: true });
  }

  const updated = await prisma.rankingEntry.update({
    where: { id },
    data: { likes: { increment: 1 } },
  });
  return NextResponse.json({ likes: updated.likes });
}
