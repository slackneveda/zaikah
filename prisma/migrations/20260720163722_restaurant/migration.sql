-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RestaurantTable" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "tableType" TEXT NOT NULL DEFAULT 'dining',
    "seats" INTEGER NOT NULL DEFAULT 4,
    "status" TEXT NOT NULL DEFAULT 'available',
    "activeOrderId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_RestaurantTable" ("activeOrderId", "createdAt", "id", "name", "seats", "status", "tableType") SELECT "activeOrderId", "createdAt", "id", "name", "seats", "status", "tableType" FROM "RestaurantTable";
DROP TABLE "RestaurantTable";
ALTER TABLE "new_RestaurantTable" RENAME TO "RestaurantTable";
CREATE UNIQUE INDEX "RestaurantTable_name_key" ON "RestaurantTable"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
