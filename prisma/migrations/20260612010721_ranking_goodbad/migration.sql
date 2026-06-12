-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_WorkRanking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'published',
    "good" INTEGER NOT NULL DEFAULT 0,
    "bad" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_WorkRanking" ("createdAt", "description", "id", "slug", "status", "title") SELECT "createdAt", "description", "id", "slug", "status", "title" FROM "WorkRanking";
DROP TABLE "WorkRanking";
ALTER TABLE "new_WorkRanking" RENAME TO "WorkRanking";
CREATE UNIQUE INDEX "WorkRanking_slug_key" ON "WorkRanking"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
