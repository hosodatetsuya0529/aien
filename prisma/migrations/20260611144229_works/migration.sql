-- CreateTable
CREATE TABLE "Work" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "year" INTEGER,
    "kind" TEXT NOT NULL DEFAULT 'movie',
    "posterUrl" TEXT,
    "overview" TEXT,
    "popularity" REAL NOT NULL DEFAULT 50,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "WorkRanking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'published',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "WorkEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rankingId" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "score" REAL NOT NULL DEFAULT 50,
    "blurb" TEXT NOT NULL DEFAULT '',
    "likes" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "WorkEntry_rankingId_fkey" FOREIGN KEY ("rankingId") REFERENCES "WorkRanking" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkEntry_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkRanking_slug_key" ON "WorkRanking"("slug");

-- CreateIndex
CREATE INDEX "WorkEntry_rankingId_idx" ON "WorkEntry"("rankingId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkEntry_rankingId_workId_key" ON "WorkEntry"("rankingId", "workId");
