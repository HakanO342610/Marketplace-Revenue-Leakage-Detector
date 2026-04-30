-- CreateTable
CREATE TABLE "UploadRun" (
    "id" TEXT NOT NULL,
    "marketplace" TEXT,
    "filename" TEXT NOT NULL,
    "rowCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UploadRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderRow" (
    "id" SERIAL NOT NULL,
    "runId" TEXT NOT NULL,
    "marketplace" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderLineId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "grossAmount" DOUBLE PRECISION NOT NULL,
    "commissionRateExpected" DOUBLE PRECISION NOT NULL,
    "commissionCharged" DOUBLE PRECISION NOT NULL,
    "logisticsFee" DOUBLE PRECISION NOT NULL,
    "campaignDiscount" DOUBLE PRECISION NOT NULL,
    "netPaid" DOUBLE PRECISION NOT NULL,
    "orderDate" TEXT NOT NULL,
    "payoutDate" TEXT NOT NULL,
    "isReturn" BOOLEAN NOT NULL,
    "refundAmount" DOUBLE PRECISION NOT NULL,
    "commissionRefund" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "OrderRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IssueResult" (
    "id" SERIAL NOT NULL,
    "runId" TEXT NOT NULL,
    "orderLineId" TEXT NOT NULL,
    "issues" TEXT NOT NULL,
    "estimatedLoss" DOUBLE PRECISION NOT NULL,
    "expectedAmount" DOUBLE PRECISION NOT NULL,
    "actualAmount" DOUBLE PRECISION NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 1.0,

    CONSTRAINT "IssueResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderRow_runId_idx" ON "OrderRow"("runId");

-- CreateIndex
CREATE INDEX "OrderRow_orderLineId_idx" ON "OrderRow"("orderLineId");

-- CreateIndex
CREATE INDEX "IssueResult_runId_idx" ON "IssueResult"("runId");

-- CreateIndex
CREATE INDEX "IssueResult_orderLineId_idx" ON "IssueResult"("orderLineId");

-- AddForeignKey
ALTER TABLE "OrderRow" ADD CONSTRAINT "OrderRow_runId_fkey" FOREIGN KEY ("runId") REFERENCES "UploadRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueResult" ADD CONSTRAINT "IssueResult_runId_fkey" FOREIGN KEY ("runId") REFERENCES "UploadRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
