// プロトタイプ用：配信先のダミーを各作品に付与（TMDBキー投入で実データに置換される）。
// 本命のU-NEXTは多くの作品に付け、他を少数ランダムで混ぜて“それっぽく”見せる。
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const OTHERS = ["Netflix", "Disney+", "Prime Video", "Hulu", "DMM TV", "Lemino", "ABEMA"];

// タイトルから決定論的な擬似乱数（再実行で同じ並び）
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

async function main() {
  const works = await prisma.work.findMany();
  for (const w of works) {
    const h = hash(w.id + w.title);
    const list: string[] = [];
    if (h % 10 !== 0) list.push("U-NEXT"); // 9割の作品にU-NEXT
    const extra = h % 3; // 0〜2件の他サービス
    for (let k = 0; k < extra; k++) {
      const name = OTHERS[(h >>> (k * 3 + 2)) % OTHERS.length];
      if (name && !list.includes(name)) list.push(name);
    }
    if (!list.length) list.push("U-NEXT");
    await prisma.work.update({ where: { id: w.id }, data: { providers: list.join(",") } });
  }
  console.log(`ダミー配信先を ${works.length} 作品に付与しました。`);
}

main().finally(() => prisma.$disconnect());
