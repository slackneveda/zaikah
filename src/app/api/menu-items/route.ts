import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, price, image, categoryId, available } = body;
    if (!name || !price || !categoryId) {
      return NextResponse.json(
        { error: "name, price, and categoryId are required" },
        { status: 400 }
      );
    }
    const item = await prisma.menuItem.create({
      data: { name, price: parseFloat(price), image, categoryId: parseInt(categoryId), available: available ?? true },
      include: { category: true },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create menu item" }, { status: 500 });
  }
}
