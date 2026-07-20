import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const dept = await prisma.department.findUnique({
      where: { id: parseInt(id) },
      include: { categories: true },
    });
    if (!dept) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(dept);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch department" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { name, color, printerName, printerAddress, printerType, active } = body;
    const dept = await prisma.department.update({
      where: { id: parseInt(id) },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(color !== undefined && { color }),
        ...(printerName !== undefined && { printerName: printerName || null }),
        ...(printerAddress !== undefined && { printerAddress: printerAddress || null }),
        ...(printerType !== undefined && { printerType: printerType || null }),
        ...(active !== undefined && { active }),
      },
    });
    return NextResponse.json(dept);
  } catch (error: unknown) {
    console.error(error);
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "Department name already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to update department" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const deptId = parseInt(id);
    // Remove department reference from categories
    await prisma.category.updateMany({
      where: { departmentId: deptId },
      data: { departmentId: null },
    });
    await prisma.department.delete({ where: { id: deptId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete department" }, { status: 500 });
  }
}
