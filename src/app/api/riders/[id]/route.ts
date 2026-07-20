import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const rider = await prisma.rider.update({
      where: { id: parseInt(id) },
      data: {
        ...(body.name !== undefined && { name: body.name.trim() }),
        ...(body.phone !== undefined && { phone: body.phone?.trim() || null }),
        ...(body.active !== undefined && { active: body.active }),
      },
    });
    return NextResponse.json(rider);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update rider" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.rider.update({
      where: { id: parseInt(id) },
      data: { active: false },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete rider" }, { status: 500 });
  }
}
