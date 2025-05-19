-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_organization_id_fkey";

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "organization_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
