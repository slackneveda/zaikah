import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, price, image, categoryId, available } = body;
    const item = await prisma.menuItem.update({
      where: { id: parseInt(id) },
      data: {
        name,
        price: price !== undefined ? parseFloat(price) : undefined,
        image,
        categoryId: categoryId !== undefined ? parseInt(categoryId) : undefined,
        available,
      },
      include: { category: true },
    });
    return NextResponse.json(item);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update menu item" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.menuItem.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete menu item" }, { status: 500 });
  }
}
