import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const riders = await prisma.rider.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(riders);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch riders" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone } = body;
    if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    const rider = await prisma.rider.create({
      data: { name: name.trim(), phone: phone?.trim() || null },
    });
    return NextResponse.json(rider, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create rider" }, { status: 500 });
  }
}
