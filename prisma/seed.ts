import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import * as bcrypt from "bcryptjs";
import * as path from "path";

const dbUrl = "file:" + path.resolve(process.cwd(), "dev.db").replace(/\\/g, "/");
const adapter = new PrismaBetterSqlite3({ url: dbUrl });
const prisma = new PrismaClient({ adapter } as never);

async function main() {
  // Delete all existing menu items and categories to start fresh
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.menuItem.deleteMany({});
  await prisma.category.deleteMany({});

  // Categories from new menu
  const categories = [
    { name: "Salad", icon: "🥗", sortOrder: 1 },
    { name: "Pakistani Karahi", icon: "🍲", sortOrder: 2 },
    { name: "Chicken Boneless Handi", icon: "🫕", sortOrder: 3 },
    { name: "Mutton Boneless Handi", icon: "🫕", sortOrder: 4 },
    { name: "Zaikah Special Chinese", icon: "🥢", sortOrder: 5 },
    { name: "Zaika Special BBQ", icon: "🔥", sortOrder: 6 },
    { name: "Fast Food", icon: "🍔", sortOrder: 7 },
    { name: "Sea Food", icon: "🐟", sortOrder: 8 },
    { name: "Sajji", icon: "🍗", sortOrder: 9 },
    { name: "Zaikah Rice", icon: "🍚", sortOrder: 10 },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: cat,
      create: cat,
    });
  }

  const saladCat = await prisma.category.findUnique({ where: { name: "Salad" } });
  const karahiCat = await prisma.category.findUnique({ where: { name: "Pakistani Karahi" } });
  const chickenHandiCat = await prisma.category.findUnique({ where: { name: "Chicken Boneless Handi" } });
  const muttonHandiCat = await prisma.category.findUnique({ where: { name: "Mutton Boneless Handi" } });
  const chineseCat = await prisma.category.findUnique({ where: { name: "Zaikah Special Chinese" } });
  const bbqCat = await prisma.category.findUnique({ where: { name: "Zaika Special BBQ" } });
  const fastFoodCat = await prisma.category.findUnique({ where: { name: "Fast Food" } });
  const seafoodCat = await prisma.category.findUnique({ where: { name: "Sea Food" } });
  const sajjiCat = await prisma.category.findUnique({ where: { name: "Sajji" } });
  const riceCat = await prisma.category.findUnique({ where: { name: "Zaikah Rice" } });

  const menuItems = [
    // Salad
    { name: "Fresh Salad", price: 150, categoryId: saladCat!.id },
    { name: "Raita (Plain)", price: 150, categoryId: saladCat!.id },
    { name: "Raita (Mint)", price: 150, categoryId: saladCat!.id },
    { name: "Katchumar Salad", price: 250, categoryId: saladCat!.id },
    // Pakistani Karahi (Full)
    { name: "Desi Murgh Karahi", price: 5000, categoryId: karahiCat!.id },
    { name: "Chicken Karahi", price: 2000, categoryId: karahiCat!.id },
    { name: "Mutton Karahi", price: 5000, categoryId: karahiCat!.id },
    { name: "Tawa Chicken Karahi", price: 1600, categoryId: karahiCat!.id },
    { name: "White Chicken Karahi", price: 2200, categoryId: karahiCat!.id },
    { name: "Beef Karahi", price: 2700, categoryId: karahiCat!.id },
    // Chicken Boneless Handi
    { name: "Chicken Jalfrezi Handi", price: 3200, categoryId: chickenHandiCat!.id },
    { name: "Chicken Ginger Handi", price: 3200, categoryId: chickenHandiCat!.id },
    { name: "Chicken Boneless Handi", price: 3200, categoryId: chickenHandiCat!.id },
    { name: "Chicken Achari Handi", price: 3200, categoryId: chickenHandiCat!.id },
    { name: "Chicken Makhni Handi", price: 3200, categoryId: chickenHandiCat!.id },
    { name: "Green Chili With Lemon", price: 3200, categoryId: chickenHandiCat!.id },
    { name: "Chicken Bartha", price: 3200, categoryId: chickenHandiCat!.id },
    // Mutton Boneless Handi
    { name: "Mutton Achari Handi", price: 5000, categoryId: muttonHandiCat!.id },
    { name: "Mutton Jalfrezi", price: 5000, categoryId: muttonHandiCat!.id },
    { name: "Mutton Boneless Handi", price: 5000, categoryId: muttonHandiCat!.id },
    { name: "Mutton Ginger Handi", price: 5000, categoryId: muttonHandiCat!.id },
    { name: "Mutton Makhni Handi", price: 5000, categoryId: muttonHandiCat!.id },
    // Zaikah Special Chinese
    { name: "Chicken Manchurian", price: 3200, categoryId: chineseCat!.id },
    { name: "Chicken Shashlick", price: 3200, categoryId: chineseCat!.id },
    { name: "Chicken Black Pepper", price: 3200, categoryId: chineseCat!.id },
    { name: "Chicken Garlic", price: 3200, categoryId: chineseCat!.id },
    { name: "Chicken Chilli Onion", price: 3200, categoryId: chineseCat!.id },
    { name: "Chicken Vegetable", price: 3200, categoryId: chineseCat!.id },
    // Zaika Special BBQ
    { name: "Chicken Tikka Boti (8 Pcs)", price: 800, categoryId: bbqCat!.id },
    { name: "Chicken Kabab", price: 0, categoryId: bbqCat!.id },
    { name: "Chicken Malai Boti (8 Pcs)", price: 0, categoryId: bbqCat!.id },
    { name: "Chicken Tikka Piece (L/B)", price: 0, categoryId: bbqCat!.id },
    { name: "Chicken Reshmi Kabab", price: 0, categoryId: bbqCat!.id },
    { name: "Chicken Hary Bhary Kabab", price: 0, categoryId: bbqCat!.id },
    { name: "Chapli Kabab", price: 0, categoryId: bbqCat!.id },
    { name: "Special BBQ Platter", price: 0, categoryId: bbqCat!.id },
    // Fast Food
    { name: "Chicken Burger", price: 0, categoryId: fastFoodCat!.id },
    { name: "Chicken Cheese Burger", price: 0, categoryId: fastFoodCat!.id },
    { name: "Chicken Spicy Burger", price: 0, categoryId: fastFoodCat!.id },
    { name: "Chicken Cheese Spicy Burger", price: 0, categoryId: fastFoodCat!.id },
    { name: "Zinger Burger", price: 0, categoryId: fastFoodCat!.id },
    // Sea Food (Full)
    { name: "Rahoo Grilled Fish", price: 1700, categoryId: seafoodCat!.id },
    { name: "Rahoo Fish (Fried)", price: 2200, categoryId: seafoodCat!.id },
    { name: "Fried Finger Fish", price: 3000, categoryId: seafoodCat!.id },
    // Sajji
    { name: "Sajji Half Kg.", price: 0, categoryId: sajjiCat!.id },
    { name: "Sajji 1 Kg.", price: 0, categoryId: sajjiCat!.id },
    // Zaikah Rice (Half prices shown)
    { name: "Egg Fried Rice", price: 1100, categoryId: riceCat!.id },
    { name: "Chicken Fried Rice", price: 1200, categoryId: riceCat!.id },
    { name: "Vegetable Fried Rice", price: 1000, categoryId: riceCat!.id },
    { name: "Chicken Biryani", price: 300, categoryId: riceCat!.id },
    { name: "Sada Biryani Rice", price: 200, categoryId: riceCat!.id },
  ];

  for (const item of menuItems) {
    await prisma.menuItem.create({ data: item });
  }

  // Tables
  for (let i = 1; i <= 12; i++) {
    await prisma.restaurantTable.upsert({
      where: { number: i },
      update: {},
      create: { number: i, seats: i <= 6 ? 4 : 6 },
    });
  }

  // Admin user
  const hashedPassword = bcrypt.hashSync("admin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@zaikah.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@zaikah.com",
      password: hashedPassword,
      role: "admin",
    },
  });

  await prisma.user.upsert({
    where: { email: "manager@zaikah.com" },
    update: {},
    create: {
      name: "Manager",
      email: "manager@zaikah.com",
      password: bcrypt.hashSync("manager123", 10),
      role: "manager",
    },
  });

  console.log("Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
