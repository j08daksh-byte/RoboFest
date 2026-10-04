-- CreateTable
CREATE TABLE "CommandRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "commandId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "missionId" TEXT,
    "source" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CommandRecord_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "CommandRecord_commandId_key" ON "CommandRecord"("commandId");
