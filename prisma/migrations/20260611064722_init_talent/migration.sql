-- CreateTable
CREATE TABLE "Talent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "kana" TEXT,
    "agency" TEXT,
    "profile" TEXT,
    "photoUrl" TEXT,
    "popularity" REAL NOT NULL DEFAULT 50,
    "tags" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Ranking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "methodNote" TEXT NOT NULL DEFAULT 'AIと読者の「いいね」をもとに自動生成・編集部調整',
    "status" TEXT NOT NULL DEFAULT 'published',
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "RankingEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rankingId" TEXT NOT NULL,
    "talentId" TEXT NOT NULL,
    "score" REAL NOT NULL DEFAULT 50,
    "blurb" TEXT NOT NULL DEFAULT '',
    "likes" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "RankingEntry_rankingId_fkey" FOREIGN KEY ("rankingId") REFERENCES "Ranking" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RankingEntry_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Like" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entryId" TEXT NOT NULL,
    "voterKey" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Like_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "RankingEntry" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Ranking_slug_key" ON "Ranking"("slug");

-- CreateIndex
CREATE INDEX "RankingEntry_rankingId_idx" ON "RankingEntry"("rankingId");

-- CreateIndex
CREATE INDEX "RankingEntry_talentId_idx" ON "RankingEntry"("talentId");

-- CreateIndex
CREATE UNIQUE INDEX "RankingEntry_rankingId_talentId_key" ON "RankingEntry"("rankingId", "talentId");

-- CreateIndex
CREATE INDEX "Like_entryId_idx" ON "Like"("entryId");

-- CreateIndex
CREATE UNIQUE INDEX "Like_entryId_voterKey_key" ON "Like"("entryId", "voterKey");
