-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Gallery" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "coverUrl" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Gallery" ("coverUrl", "createdAt", "description", "id", "slug", "title", "updatedAt") SELECT "coverUrl", "createdAt", "description", "id", "slug", "title", "updatedAt" FROM "Gallery";
DROP TABLE "Gallery";
ALTER TABLE "new_Gallery" RENAME TO "Gallery";
CREATE UNIQUE INDEX "Gallery_slug_key" ON "Gallery"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
