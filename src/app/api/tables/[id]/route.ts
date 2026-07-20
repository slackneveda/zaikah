import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const table = await prisma.restaurantTable.findUnique({
      where: { id: parseInt(id) },
      include: {
        orders: {
          where: { status: { in: ["pending", "preparing"] } },
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            items: { include: { menuItem: true } },
            orderTaker: true,
            customer: true,
          },
        },
      },
    });
    if (!table) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(table);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch table" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, seats, name, activeOrderId } = body;
    const table = await prisma.restaurantTable.update({
      where: { id: parseInt(id) },
      data: {
        ...(status !== undefined ? { status } : {}),
        ...(seats !== undefined ? { seats: parseInt(seats) } : {}),
        ...(name !== undefined ? { name } : {}),
        ...(activeOrderId !== undefined ? { activeOrderId } : {}),
      },
    });
    return NextResponse.json(table);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update table" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.restaurantTable.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete table" }, { status: 500 });
  }
}
