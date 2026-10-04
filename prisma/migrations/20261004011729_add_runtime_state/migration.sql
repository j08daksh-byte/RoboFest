-- CreateTable
CREATE TABLE "RuntimeState" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "systemMode" TEXT NOT NULL DEFAULT 'SIMULATED',
    "positionX" REAL NOT NULL DEFAULT 0,
    "positionY" REAL NOT NULL DEFAULT 0,
    "positionZ" REAL NOT NULL DEFAULT 0,
    "armY" REAL NOT NULL DEFAULT 0,
    "armX" REAL NOT NULL DEFAULT 0,
    "torchEnabled" BOOLEAN NOT NULL DEFAULT false,
    "electromagnetEnabled" BOOLEAN NOT NULL DEFAULT false,
    "emergencyActive" BOOLEAN NOT NULL DEFAULT false,
    "activeMissionId" TEXT,
    "lastCommandId" TEXT,
    "stateVersion" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL
);
