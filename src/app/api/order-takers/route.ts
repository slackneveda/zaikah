import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get("all") === "true";
    const deptId = searchParams.get("departmentId");
    const takers = await prisma.orderTaker.findMany({
      where: {
        ...(all ? {} : { active: true }),
        ...(deptId ? { departmentId: parseInt(deptId) } : {}),
      },
      orderBy: { name: "asc" },
      include: { department: { select: { id: true, name: true } } },
    });
    return NextResponse.json(takers);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch order takers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, designation, departmentId } = body;
    if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    const taker = await prisma.orderTaker.create({
      data: {
        name: name.trim(),
        phone: phone?.trim() || null,
        designation: designation?.trim() || null,
        departmentId: departmentId ? parseInt(departmentId) : null,
      },
      include: { department: { select: { id: true, name: true } } },
    });
    return NextResponse.json(taker, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create order taker" }, { status: 500 });
  }
}
