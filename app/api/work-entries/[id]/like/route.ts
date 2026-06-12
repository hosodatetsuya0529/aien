import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 作品ランキングのいいね（プロトタイプ：端末側で重複防止、サーバーは加算）
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const updated = await prisma.workEntry.update({
      where: { id },
      data: { likes: { increment: 1 } },
    });
    return NextResponse.json({ likes: updated.likes });
  } catch {
    return NextResponse.json({ error: "対象が見つかりません" }, { status: 404 });
  }
}
