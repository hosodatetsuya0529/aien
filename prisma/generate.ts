import { PrismaClient } from "@prisma/client";
import { THEME_POOL, generateRankingFromTheme } from "../lib/generator";

const prisma = new PrismaClient();

// 既存の実在タレント（写真・話題度は取得済み）にタグを付与してテーマ生成に使う。
// ※タグ付けは「AI=私の知識」による（実運用ではLLMが担う部分）。
const TAGS: Record<string, string> = {
  "安藤サクラ": "女優,演技派,映画,話題,個性派",
  "宮沢りえ": "女優,演技派,ベテラン,映画,知性派",
  "満島ひかり": "女優,演技派,個性派,話題",
  "松たか子": "女優,演技派,ベテラン,知性派,舞台",
  "蒼井優": "女優,演技派,映画,個性派",
  "尾野真千子": "女優,演技派,個性派",
  "杉咲花": "女優,演技派,若手,透明感,話題",
  "長澤まさみ": "女優,話題,CM,映画,ドラマ主演",
  "黒木華": "女優,演技派,透明感",
  "田中裕子": "女優,演技派,ベテラン",
  "永作博美": "女優,演技派,ベテラン,お母さん役",
  "吉田羊": "女優,演技派,お母さん役,ドラマ主演",
  "新垣結衣": "女優,話題,CM,透明感,ドラマ主演",
  "綾瀬はるか": "女優,話題,CM,ドラマ主演",
  "広瀬すず": "女優,若手,話題,CM,透明感",
  "石原さとみ": "女優,話題,CM,ドラマ主演",
  "有村架純": "女優,話題,CM,透明感,ドラマ主演",
  "浜辺美波": "女優,若手,話題,CM,透明感",
  "今田美桜": "女優,若手,話題,CM",
  "川口春奈": "女優,若手,話題,CM",
  "上戸彩": "女優,CM,ベテラン,ドラマ主演",
  "深田恭子": "女優,CM,ベテラン",
  "永野芽郁": "女優,若手,話題,CM,透明感",
  "松嶋菜々子": "女優,ベテラン,お母さん役,国民的,ドラマ主演",
  "石田ゆり子": "女優,ベテラン,お母さん役,透明感,国民的",
  "天海祐希": "女優,ベテラン,お母さん役,国民的,ドラマ主演,知性派",
  "木村佳乃": "女優,ベテラン,お母さん役",
  "真矢ミキ": "女優,ベテラン,お母さん役",
  "仲間由紀恵": "女優,ベテラン,お母さん役,ドラマ主演",
  "鈴木保奈美": "女優,ベテラン,お母さん役,ドラマ主演",
  "田中美佐子": "女優,ベテラン,お母さん役",
  "財前直見": "女優,ベテラン,お母さん役",
  "役所広司": "俳優,演技派,ベテラン,映画,声,渋い,国民的",
  "西島秀俊": "俳優,演技派,声,渋い,CM,ドラマ主演",
  "阿部寛": "俳優,演技派,ベテラン,CM,渋い,国民的,ドラマ主演",
  "堺雅人": "俳優,演技派,ドラマ主演,知性派",
  "菅田将暉": "俳優,演技派,若手,話題,映画,個性派",
  "松山ケンイチ": "俳優,演技派,映画,個性派",
  "柄本佑": "俳優,演技派,映画,個性派",
  "池松壮亮": "俳優,演技派,映画,若手,個性派",
  "藤原竜也": "俳優,演技派,舞台,映画",
  "妻夫木聡": "俳優,演技派,映画",
  "大泉洋": "俳優,バラエティ,コメディ,話題,ドラマ主演,映画",
  "リリー・フランキー": "俳優,個性派,映画,声,渋い",
  "ムロツヨシ": "俳優,バラエティ,コメディ,話題",
  "佐藤二朗": "俳優,バラエティ,コメディ,個性派",
  "賀来賢人": "俳優,若手,話題,バラエティ,ドラマ主演",
  "山田孝之": "俳優,演技派,個性派,映画,話題",
  "古田新太": "俳優,演技派,舞台,個性派,ベテラン",
  "神木隆之介": "俳優,若手,話題,演技派,透明感,声",
  "高橋一生": "俳優,演技派,話題,声,個性派",
  "中井貴一": "俳優,ベテラン,声,渋い,知性派,国民的",
  "内野聖陽": "俳優,演技派,声,舞台,ベテラン",
  "津田健次郎": "俳優,声,個性派,話題",
  "堤真一": "俳優,演技派,ベテラン,映画,渋い",
};

async function main() {
  // タグ付与
  let tagged = 0;
  for (const [name, tags] of Object.entries(TAGS)) {
    const r = await prisma.talent.updateMany({ where: { name }, data: { tags } });
    tagged += r.count;
  }
  console.log(`Tagged ${tagged} talents`);

  // 旧ランキングを消して作り直し（タレント＝写真はそのまま）
  await prisma.like.deleteMany();
  await prisma.rankingEntry.deleteMany();
  await prisma.ranking.deleteMany();

  let made = 0;
  for (const theme of THEME_POOL) {
    const r = await generateRankingFromTheme(prisma, theme);
    if (r) made++;
  }
  console.log(`Generated ${made}/${THEME_POOL.length} rankings`);

  // createdAt をばらして「次々生成」感を出す
  const rs = await prisma.ranking.findMany();
  let i = 0;
  for (const r of rs) {
    const mins = [1, 3, 6, 12, 19, 27, 38, 52, 70, 95, 130, 175][i % 12] + Math.floor(Math.random() * 3);
    await prisma.ranking.update({ where: { id: r.id }, data: { createdAt: new Date(Date.now() - mins * 60000) } });
    i++;
  }
  console.log("Staggered createdAt");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
