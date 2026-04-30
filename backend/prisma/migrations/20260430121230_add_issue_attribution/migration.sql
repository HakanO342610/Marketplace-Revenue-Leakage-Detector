-- CreateTable
CREATE TABLE "IssueAttribution" (
    "id" SERIAL NOT NULL,
    "issueResultId" INTEGER NOT NULL,
    "ruleName" TEXT NOT NULL,
    "expected" DOUBLE PRECISION NOT NULL,
    "actual" DOUBLE PRECISION NOT NULL,
    "variance" DOUBLE PRECISION NOT NULL,
    "loss" DOUBLE PRECISION NOT NULL,
    "severity" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "explanation" TEXT NOT NULL,

    CONSTRAINT "IssueAttribution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IssueAttribution_issueResultId_idx" ON "IssueAttribution"("issueResultId");

-- CreateIndex
CREATE INDEX "IssueAttribution_ruleName_idx" ON "IssueAttribution"("ruleName");

-- AddForeignKey
ALTER TABLE "IssueAttribution" ADD CONSTRAINT "IssueAttribution_issueResultId_fkey" FOREIGN KEY ("issueResultId") REFERENCES "IssueResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;
