-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Mission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shipName" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "hullSection" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "progressPercentage" INTEGER NOT NULL DEFAULT 0,
    "startedAt" DATETIME,
    "pausedAt" DATETIME,
    "completedAt" DATETIME,
    "abortedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "stateVersion" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "new_Mission" ("createdAt", "hullSection", "id", "objective", "shipName", "status", "updatedAt") SELECT "createdAt", "hullSection", "id", "objective", "shipName", "status", "updatedAt" FROM "Mission";
DROP TABLE "Mission";
ALTER TABLE "new_Mission" RENAME TO "Mission";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
