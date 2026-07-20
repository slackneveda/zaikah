import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function generateOrderNumber(type: string) {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
  const timePart = now.getTime().toString().slice(-5);
  const prefix = type === "delivery" ? "DL" : type === "takeaway" ? "TW" : "ZK";
  return `${prefix}-${datePart}-${timePart}`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") ?? "500");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const orderTakerId = searchParams.get("orderTakerId");
    const riderId = searchParams.get("riderId");
    const customerId = searchParams.get("customerId");
    const tableId = searchParams.get("tableId");

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
        ...(orderTakerId ? { orderTakerId: parseInt(orderTakerId) } : {}),
        ...(riderId ? { riderId: parseInt(riderId) } : {}),
        ...(customerId ? { customerId: parseInt(customerId) } : {}),
        ...(tableId ? { tableId: parseInt(tableId) } : {}),
        ...dateFilter,
      },
      include: {
        items: { include: { department: true } },
        table: true,
        customer: true,
        orderTaker: true,
        rider: true,
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
    const {
      type,
      tableId,
      items,
      cashReceived,
      customerId,
      orderTakerId,
      riderId,
      customerName,
      customerPhone,
      customerAddress,
      notes,
      discount = 0,
      tax = 0,
      status: orderStatus,
    } = body;

    if (!type || !items || items.length === 0) {
      return NextResponse.json(
        { error: "type and items are required" },
        { status: 400 }
      );
    }

    // For delivery orders, require customer info
    if (type === "delivery" && !customerPhone && !customerId) {
      return NextResponse.json(
        { error: "Customer phone is required for delivery orders" },
        { status: 400 }
      );
    }

    const subtotal = items.reduce(
      (sum: number, item: { price: number; quantity: number }) =>
        sum + item.price * item.quantity,
      0
    );
    const discountAmt = parseFloat(discount) || 0;
    const taxAmt = parseFloat(tax) || 0;
    const total = subtotal - discountAmt + taxAmt;
    const change = cashReceived ? Math.max(0, parseFloat(cashReceived) - total) : 0;

    const finalStatus = orderStatus || (type === "delivery" ? "pending" : "completed");

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(type),
          type,
          status: finalStatus,
          tableId: tableId ? parseInt(tableId) : null,
          customerId: customerId ? parseInt(customerId) : null,
          orderTakerId: orderTakerId ? parseInt(orderTakerId) : null,
          riderId: riderId ? parseInt(riderId) : null,
          customerName: customerName?.trim() || null,
          customerPhone: customerPhone?.trim() || null,
          customerAddress: customerAddress?.trim() || null,
          notes: notes?.trim() || null,
          subtotal,
          discount: discountAmt,
          tax: taxAmt,
          total,
          cashReceived: cashReceived ? parseFloat(cashReceived) : null,
          change,
          items: {
            create: items.map((item: {
              menuItemId: number;
              name: string;
              price: number;
              quantity: number;
              notes?: string;
              departmentId?: number;
            }) => ({
              menuItemId: item.menuItemId,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              notes: item.notes || null,
              departmentId: item.departmentId || null,
              subtotal: item.price * item.quantity,
            })),
          },
        },
        include: { items: { include: { department: true } }, table: true, customer: true, orderTaker: true, rider: true },
      });

      // Mark table as occupied for dine-in/takeaway pending, or available after completion
      if (tableId) {
        if (finalStatus === "completed") {
          await tx.restaurantTable.update({
            where: { id: parseInt(tableId) },
            data: { status: "available", activeOrderId: null },
          });
        } else {
          await tx.restaurantTable.update({
            where: { id: parseInt(tableId) },
            data: { status: "occupied", activeOrderId: newOrder.id },
          });
        }
      }

      return newOrder;
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
