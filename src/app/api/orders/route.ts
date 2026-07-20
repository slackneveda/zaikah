import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function generateOrderNumber() {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
  const timePart = now.getTime().toString().slice(-5);
  return `ZK-${datePart}-${timePart}`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") ?? "500");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const dateFilter =
      from && to
        ? {
            createdAt: {
              gte: new Date(from + "T00:00:00.000Z"),
              lte: new Date(to + "T23:59:59.999Z"),
            },
          }
        : {};

    const orders = await prisma.order.findMany({
      where: {
        ...(type ? { type } : {}),
        ...(status ? { status } : {}),
        ...dateFilter,
      },
      include: {
        items: true,
        table: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return NextResponse.json(orders);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, tableId, items, cashReceived } = body;

    if (!type || !items || items.length === 0) {
      return NextResponse.json(
        { error: "type and items are required" },
        { status: 400 }
      );
    }

    const subtotal = items.reduce(
      (sum: number, item: { price: number; quantity: number }) =>
        sum + item.price * item.quantity,
      0
    );
    const total = subtotal;
    const change = cashReceived ? Math.max(0, cashReceived - total) : 0;

    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        type,
        status: "completed",
        tableId: tableId ? parseInt(tableId) : null,
        subtotal,
        total,
        cashReceived: cashReceived ? parseFloat(cashReceived) : null,
        change,
        items: {
          create: items.map((item: {
            menuItemId: number;
            name: string;
            price: number;
            quantity: number;
          }) => ({
            menuItemId: item.menuItemId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            subtotal: item.price * item.quantity,
          })),
        },
      },
      include: { items: true, table: true },
    });

    // Mark table as available after order completion
    if (tableId) {
      await prisma.restaurantTable.update({
        where: { id: parseInt(tableId) },
        data: { status: "available" },
      });
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
