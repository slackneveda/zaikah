import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: "asc" },
      include: { categories: { select: { id: true, name: true } } },
    });
    return NextResponse.json(departments);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch departments" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, color, printerName, printerAddress, printerType } = body;
    if (!name?.trim()) {
      return NextResponse.json({ error: "Department name is required" }, { status: 400 });
    }
    const department = await prisma.department.create({
      data: {
        name: name.trim(),
        color: color || "#6B7599",
        printerName: printerName || null,
        printerAddress: printerAddress || null,
        printerType: printerType || null,
      },
    });
    return NextResponse.json(department, { status: 201 });
  } catch (error: unknown) {
    console.error(error);
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "Department name already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create department" }, { status: 500 });
  }
}
