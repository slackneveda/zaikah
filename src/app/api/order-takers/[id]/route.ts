import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const taker = await prisma.orderTaker.update({
      where: { id: parseInt(id) },
      data: {
        ...(body.name !== undefined && { name: body.name.trim() }),
        ...(body.phone !== undefined && { phone: body.phone?.trim() || null }),
        ...(body.designation !== undefined && { designation: body.designation?.trim() || null }),
        ...(body.departmentId !== undefined && { departmentId: body.departmentId ? parseInt(body.departmentId) : null }),
        ...(body.active !== undefined && { active: body.active }),
      },
      include: { department: { select: { id: true, name: true } } },
    });
    return NextResponse.json(taker);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update order taker" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.orderTaker.update({
      where: { id: parseInt(id) },
      data: { active: false },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete order taker" }, { status: 500 });
  }
}
