import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const tables = await prisma.restaurantTable.findMany({
      orderBy: { number: "asc" },
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
    const { number, seats } = body;
    if (!number) return NextResponse.json({ error: "Table number required" }, { status: 400 });
    const table = await prisma.restaurantTable.create({
      data: { number: parseInt(number), seats: seats ? parseInt(seats) : 4 },
    });
    return NextResponse.json(table, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create table" }, { status: 500 });
  }
}
