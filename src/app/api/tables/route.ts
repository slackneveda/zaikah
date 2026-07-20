import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tableType = searchParams.get("type");
    const tables = await prisma.restaurantTable.findMany({
      where: tableType ? { tableType } : {},
      orderBy: { name: "asc" },
      include: {
        orders: {
          where: { status: { in: ["pending", "preparing"] } },
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { items: true, orderTaker: true },
        },
      },
    });
    return NextResponse.json(tables);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch tables" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, tableType, seats } = body;
    if (!name?.trim()) return NextResponse.json({ error: "Table name required" }, { status: 400 });
    const table = await prisma.restaurantTable.create({
      data: {
        name: name.trim(),
        tableType: tableType || "dining",
        seats: seats ? parseInt(seats) : 4,
      },
    });
    return NextResponse.json(table, { status: 201 });
  } catch (error: unknown) {
    console.error(error);
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "Table name already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create table" }, { status: 500 });
  }
}
