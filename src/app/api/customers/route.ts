import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone");
    const search = searchParams.get("search");

    if (phone) {
      const customer = await prisma.customer.findUnique({
        where: { phone },
        include: {
          orders: {
            orderBy: { createdAt: "desc" },
            take: 20,
            include: { items: true },
          },
        },
      });
      return NextResponse.json(customer ?? null);
    }

    const customers = await prisma.customer.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search } },
              { phone: { contains: search } },
            ],
          }
        : {},
      orderBy: { name: "asc" },
      include: {
        _count: { select: { orders: true } },
        orders: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { createdAt: true, total: true },
        },
      },
    });
    return NextResponse.json(customers);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, address, notes } = body;
    if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    if (!phone?.trim()) return NextResponse.json({ error: "Phone is required" }, { status: 400 });

    const customer = await prisma.customer.create({
      data: {
        name: name.trim(),
        phone: phone.trim(),
        address: address?.trim() || null,
        notes: notes?.trim() || null,
      },
    });
    return NextResponse.json(customer, { status: 201 });
  } catch (error: unknown) {
    console.error(error);
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "Phone number already registered" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
  }
}
