-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_OrderTaker" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "designation" TEXT,
    "phone" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "departmentId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OrderTaker_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_OrderTaker" ("active", "createdAt", "id", "name", "phone", "updatedAt") SELECT "active", "createdAt", "id", "name", "phone", "updatedAt" FROM "OrderTaker";
DROP TABLE "OrderTaker";
ALTER TABLE "new_OrderTaker" RENAME TO "OrderTaker";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
