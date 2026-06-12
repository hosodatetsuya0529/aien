// 公開ランキング数を出力するだけのユーティリティ（増産ループの停止判定用）
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const published = await prisma.workRanking.count({ where: { status: "published" } });
  console.log(published);
  await prisma.$disconnect();
}
main();
