/* eslint-disable @typescript-eslint/no-explicit-any */
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

  // Ensure Departments exist first so we can link categories
  const departments = [
    { name: "Kitchen", color: "#ef4444" },
    { name: "Bar", color: "#3b82f6" },
    { name: "Dessert", color: "#ec4899" },
    { name: "Drinks", color: "#22c55e" },
    { name: "BBQ", color: "#f97316" },
  ];
  for (const dept of departments) {
    await prisma.department.upsert({
      where: { name: dept.name },
      update: {},
      create: dept,
    });
  }

  const kitchenDept = await prisma.department.findUnique({ where: { name: "Kitchen" } });
  const drinksDept = await prisma.department.findUnique({ where: { name: "Drinks" } });

  // Kitchen categories — all existing food categories
  const kitchenCategories = [
    { name: "Salad", icon: "🥗", sortOrder: 1, departmentId: kitchenDept!.id },
    { name: "Pakistani Karahi", icon: "🍲", sortOrder: 2, departmentId: kitchenDept!.id },
    { name: "Chicken Boneless Handi", icon: "🫕", sortOrder: 3, departmentId: kitchenDept!.id },
    { name: "Mutton Boneless Handi", icon: "🫕", sortOrder: 4, departmentId: kitchenDept!.id },
    { name: "Zaikah Special Chinese", icon: "🥢", sortOrder: 5, departmentId: kitchenDept!.id },
    { name: "Zaika Special BBQ", icon: "🔥", sortOrder: 6, departmentId: kitchenDept!.id },
    { name: "Fast Food", icon: "🍔", sortOrder: 7, departmentId: kitchenDept!.id },
    { name: "Sea Food", icon: "🐟", sortOrder: 8, departmentId: kitchenDept!.id },
    { name: "Sajji", icon: "🍗", sortOrder: 9, departmentId: kitchenDept!.id },
    { name: "Zaikah Rice", icon: "🍚", sortOrder: 10, departmentId: kitchenDept!.id },
  ];

  // Drinks categories
  const drinksCategories = [
    { name: "Cold Drinks", icon: "🥤", sortOrder: 1, departmentId: drinksDept!.id },
    { name: "Hot Drinks", icon: "☕", sortOrder: 2, departmentId: drinksDept!.id },
    { name: "Fresh Juices", icon: "🍹", sortOrder: 3, departmentId: drinksDept!.id },
    { name: "Shakes & Smoothies", icon: "🥛", sortOrder: 4, departmentId: drinksDept!.id },
    { name: "Water & Minerals", icon: "💧", sortOrder: 5, departmentId: drinksDept!.id },
  ];

  for (const cat of [...kitchenCategories, ...drinksCategories]) {
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
  const coldDrinksCat = await prisma.category.findUnique({ where: { name: "Cold Drinks" } });
  const hotDrinksCat = await prisma.category.findUnique({ where: { name: "Hot Drinks" } });
  const juicesCat = await prisma.category.findUnique({ where: { name: "Fresh Juices" } });
  const shakesCat = await prisma.category.findUnique({ where: { name: "Shakes & Smoothies" } });
  const waterCat = await prisma.category.findUnique({ where: { name: "Water & Minerals" } });

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
    // Cold Drinks
    { name: "Pepsi (250ml)", price: 80, categoryId: coldDrinksCat!.id },
    { name: "Pepsi (500ml)", price: 120, categoryId: coldDrinksCat!.id },
    { name: "7Up (250ml)", price: 80, categoryId: coldDrinksCat!.id },
    { name: "7Up (500ml)", price: 120, categoryId: coldDrinksCat!.id },
    { name: "Mirinda (250ml)", price: 80, categoryId: coldDrinksCat!.id },
    { name: "Mountain Dew (250ml)", price: 80, categoryId: coldDrinksCat!.id },
    { name: "Mountain Dew (500ml)", price: 120, categoryId: coldDrinksCat!.id },
    { name: "Coca Cola (250ml)", price: 80, categoryId: coldDrinksCat!.id },
    { name: "Coca Cola (500ml)", price: 120, categoryId: coldDrinksCat!.id },
    { name: "Sprite (250ml)", price: 80, categoryId: coldDrinksCat!.id },
    // Hot Drinks
    { name: "Tea", price: 80, categoryId: hotDrinksCat!.id },
    { name: "Kashmiri Tea", price: 150, categoryId: hotDrinksCat!.id },
    { name: "Green Tea", price: 100, categoryId: hotDrinksCat!.id },
    { name: "Coffee (Black)", price: 150, categoryId: hotDrinksCat!.id },
    { name: "Cappuccino", price: 250, categoryId: hotDrinksCat!.id },
    { name: "Latte", price: 280, categoryId: hotDrinksCat!.id },
    { name: "Doodh Pati", price: 100, categoryId: hotDrinksCat!.id },
    // Fresh Juices
    { name: "Orange Juice", price: 200, categoryId: juicesCat!.id },
    { name: "Mango Juice", price: 200, categoryId: juicesCat!.id },
    { name: "Apple Juice", price: 200, categoryId: juicesCat!.id },
    { name: "Watermelon Juice", price: 180, categoryId: juicesCat!.id },
    { name: "Mix Fruit Juice", price: 250, categoryId: juicesCat!.id },
    { name: "Lemonade", price: 150, categoryId: juicesCat!.id },
    { name: "Sugarcane Juice", price: 100, categoryId: juicesCat!.id },
    // Shakes & Smoothies
    { name: "Mango Shake", price: 300, categoryId: shakesCat!.id },
    { name: "Banana Shake", price: 280, categoryId: shakesCat!.id },
    { name: "Strawberry Shake", price: 320, categoryId: shakesCat!.id },
    { name: "Chocolate Shake", price: 350, categoryId: shakesCat!.id },
    { name: "Oreo Shake", price: 380, categoryId: shakesCat!.id },
    { name: "Mix Fruit Shake", price: 350, categoryId: shakesCat!.id },
    { name: "Lassi (Sweet)", price: 200, categoryId: shakesCat!.id },
    { name: "Lassi (Salted)", price: 200, categoryId: shakesCat!.id },
    // Water & Minerals
    { name: "Mineral Water (500ml)", price: 60, categoryId: waterCat!.id },
    { name: "Mineral Water (1.5L)", price: 100, categoryId: waterCat!.id },
    { name: "Soda Water", price: 80, categoryId: waterCat!.id },
  ];

  for (const item of menuItems) {
    await prisma.menuItem.create({ data: item });
  }

  // Dining Tables G1-G20
  for (let i = 1; i <= 20; i++) {
    await prisma.restaurantTable.upsert({
      where: { name: `G${i}` },
      update: {},
      create: { name: `G${i}`, tableType: "dining", seats: i <= 10 ? 4 : 6 },
    });
  }
  // Takeaway slots T1-T10
  for (let i = 1; i <= 10; i++) {
    await prisma.restaurantTable.upsert({
      where: { name: `T${i}` },
      update: {},
      create: { name: `T${i}`, tableType: "takeaway", seats: 2 },
    });
  }

  // System config - master password and role passwords
  const masterPassword = bcrypt.hashSync("master123", 10);
  const configs = [
    { key: "master_password", value: masterPassword },
    { key: "master_password_enabled", value: "true" },
    { key: "role_password_admin", value: bcrypt.hashSync("admin123", 10) },
    { key: "role_password_manager", value: bcrypt.hashSync("manager123", 10) },
    { key: "role_password_dining", value: bcrypt.hashSync("dining123", 10) },
    { key: "role_password_takeaway", value: bcrypt.hashSync("takeaway123", 10) },
    { key: "role_password_delivery", value: bcrypt.hashSync("delivery123", 10) },
  ];
  for (const cfg of configs) {
    await (prisma.systemConfig as any).upsert({
      where: { key: cfg.key },
      update: { value: cfg.value },
      create: cfg,
    });
  }

  // Users
  await prisma.user.upsert({
    where: { email: "admin@zaikah.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@zaikah.com",
      password: bcrypt.hashSync("admin123", 10),
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
  await prisma.user.upsert({
    where: { email: "dining@zaikah.com" },
    update: {},
    create: {
      name: "Dining Staff",
      email: "dining@zaikah.com",
      password: bcrypt.hashSync("dining123", 10),
      role: "dining",
    },
  });
  await prisma.user.upsert({
    where: { email: "takeaway@zaikah.com" },
    update: {},
    create: {
      name: "Takeaway Staff",
      email: "takeaway@zaikah.com",
      password: bcrypt.hashSync("takeaway123", 10),
      role: "takeaway",
    },
  });
  await prisma.user.upsert({
    where: { email: "delivery@zaikah.com" },
    update: {},
    create: {
      name: "Delivery Staff",
      email: "delivery@zaikah.com",
      password: bcrypt.hashSync("delivery123", 10),
      role: "delivery",
    },
  });

  // Sample order takers
  const orderTakers = ["Ali Khan", "Sara Ahmed", "Hassan Raza"];
  for (const name of orderTakers) {
    const existing = await (prisma.orderTaker as any).findFirst({ where: { name } });
    if (!existing) {
      await (prisma.orderTaker as any).create({ data: { name } });
    }
  }

  // Sample riders
  const riders = ["Usman Rider", "Bilal Express", "Tariq Swift"];
  for (const name of riders) {
    const existing = await (prisma.rider as any).findFirst({ where: { name } });
    if (!existing) {
      await (prisma.rider as any).create({ data: { name } });
    }
  }

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
