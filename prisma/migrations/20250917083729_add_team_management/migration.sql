/*
  Warnings:

  - You are about to drop the column `managerId` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `allocation` on the `team_assignments` table. All the data in the column will be lost.
  - You are about to drop the column `memberId` on the `team_assignments` table. All the data in the column will be lost.
  - You are about to drop the column `joinDate` on the `team_members` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `team_members` table. All the data in the column will be lost.
  - You are about to drop the column `managerId` on the `team_members` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `team_members` table. All the data in the column will be lost.
  - Added the required column `name` to the `projects` table without a default value. This is not possible if the table is not empty.
  - Added the required column `teamMemberId` to the `team_assignments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `firstName` to the `team_members` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `team_members` table without a default value. This is not possible if the table is not empty.
  - Added the required column `position` to the `team_members` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_projects" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'planning',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "startDate" DATETIME,
    "endDate" DATETIME,
    "deadline" DATETIME,
    "budget" REAL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "clientName" TEXT,
    "clientEmail" TEXT,
    "tags" TEXT,
    "requirements" TEXT,
    "deliverables" TEXT,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_projects" ("budget", "clientName", "createdAt", "description", "endDate", "id", "priority", "progress", "startDate", "status", "tags", "updatedAt") SELECT "budget", "clientName", "createdAt", "description", "endDate", "id", "priority", "progress", "startDate", "status", "tags", "updatedAt" FROM "projects";
DROP TABLE "projects";
ALTER TABLE "new_projects" RENAME TO "projects";
CREATE TABLE "new_team_assignments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamMemberId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'contributor',
    "startDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" DATETIME,
    "hoursAllocated" REAL,
    "hoursWorked" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'assigned',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "team_assignments_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "team_members" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "team_assignments_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_team_assignments" ("createdAt", "endDate", "id", "notes", "projectId", "role", "startDate", "status", "updatedAt") SELECT "createdAt", "endDate", "id", "notes", "projectId", "role", "startDate", "status", "updatedAt" FROM "team_assignments";
DROP TABLE "team_assignments";
ALTER TABLE "new_team_assignments" RENAME TO "team_assignments";
CREATE UNIQUE INDEX "team_assignments_teamMemberId_projectId_key" ON "team_assignments"("teamMemberId", "projectId");
CREATE TABLE "new_team_members" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "position" TEXT NOT NULL,
    "department" TEXT,
    "role" TEXT NOT NULL DEFAULT 'member',
    "skills" TEXT,
    "experience" TEXT,
    "salary" REAL,
    "hireDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'active',
    "avatar" TEXT,
    "bio" TEXT,
    "address" TEXT,
    "emergencyContact" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_team_members" ("avatar", "bio", "createdAt", "department", "email", "id", "phone", "role", "salary", "skills", "status", "updatedAt") SELECT "avatar", "bio", "createdAt", "department", "email", "id", "phone", "role", "salary", "skills", "status", "updatedAt" FROM "team_members";
DROP TABLE "team_members";
ALTER TABLE "new_team_members" RENAME TO "team_members";
CREATE UNIQUE INDEX "team_members_email_key" ON "team_members"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
