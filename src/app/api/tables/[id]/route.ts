import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, seats, number } = body;
    const table = await prisma.restaurantTable.update({
      where: { id: parseInt(id) },
      data: {
        ...(status !== undefined ? { status } : {}),
        ...(seats !== undefined ? { seats: parseInt(seats) } : {}),
        ...(number !== undefined ? { number: parseInt(number) } : {}),
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
