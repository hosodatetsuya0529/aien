import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateNextRanking } from "@/lib/generator";

// AIに新しいランキングを1つ自動生成させる（「次々に作る」のデモ）
export async function POST() {
  const ranking = await generateNextRanking(prisma);
  if (!ranking) {
    return NextResponse.json({ done: true, message: "テーマの素を出し切りました（実運用ではLLMが無限に追加）" });
  }
  return NextResponse.json({ slug: ranking.slug, title: ranking.title });
}
