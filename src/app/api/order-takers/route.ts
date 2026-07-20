import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const takers = await prisma.orderTaker.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
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
    const { name, phone } = body;
    if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    const taker = await prisma.orderTaker.create({
      data: { name: name.trim(), phone: phone?.trim() || null },
    });
    return NextResponse.json(taker, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create order taker" }, { status: 500 });
  }
}
