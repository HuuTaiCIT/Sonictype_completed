import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("prisma.raceText exists?", !!prisma.raceText);
    const texts = await prisma.raceText.findMany();
    console.log(texts);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}
main();
