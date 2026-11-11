-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('READER', 'ADMIN');

-- CreateEnum
CREATE TYPE "BookCopyStatus" AS ENUM ('AVAILABLE', 'LOANED', 'MAINTENANCE', 'RETIRED');

-- CreateEnum
CREATE TYPE "LoanStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'RETURNED', 'OVERDUE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'READER',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Book" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "autor" TEXT NOT NULL,
    "editorial" TEXT,
    "isbn" TEXT,
    "genero" TEXT NOT NULL,
    "anio" INTEGER,
    "sinopsis" TEXT,
    "portada" TEXT,
    "destacado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookCopy" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "codigoInventario" TEXT NOT NULL,
    "estado" "BookCopyStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookCopy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Loan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookCopyId" TEXT NOT NULL,
    "fechaSolicitud" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaPrestamo" TIMESTAMP(3),
    "fechaVencimiento" TIMESTAMP(3),
    "fechaDevolucion" TIMESTAMP(3),
    "estado" "LoanStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Loan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Book_isbn_key" ON "Book"("isbn");

-- CreateIndex
CREATE UNIQUE INDEX "BookCopy_codigoInventario_key" ON "BookCopy"("codigoInventario");

-- CreateIndex
CREATE INDEX "BookCopy_bookId_idx" ON "BookCopy"("bookId");

-- CreateIndex
CREATE INDEX "BookCopy_estado_idx" ON "BookCopy"("estado");

-- CreateIndex
CREATE INDEX "Loan_userId_estado_idx" ON "Loan"("userId", "estado");

-- CreateIndex
CREATE INDEX "Loan_bookCopyId_estado_idx" ON "Loan"("bookCopyId", "estado");

-- CreateIndex
CREATE INDEX "Favorite_bookId_idx" ON "Favorite"("bookId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_bookId_key" ON "Favorite"("userId", "bookId");

-- AddForeignKey
ALTER TABLE "BookCopy" ADD CONSTRAINT "BookCopy_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_bookCopyId_fkey" FOREIGN KEY ("bookCopyId") REFERENCES "BookCopy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;
