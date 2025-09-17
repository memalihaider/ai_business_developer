-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "value" TEXT,
    "status" TEXT NOT NULL DEFAULT 'New',
    "owner" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "case_studies" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "client" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "problem" TEXT,
    "solution" TEXT,
    "results" TEXT,
    "cover" TEXT,
    "tags" TEXT NOT NULL,
    "metrics" TEXT,
    "techStack" TEXT,
    "draft" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "leads_email_key" ON "leads"("email");
