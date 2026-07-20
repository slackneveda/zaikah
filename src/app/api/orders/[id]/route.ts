import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const orderId = parseInt(id);
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { menuItem: true, department: true } },
        table: true,
        customer: true,
        orderTaker: true,
        rider: true,
      },
    });
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(order);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const orderId = parseInt(id);
    const body = await request.json();
    const {
      status,
      riderId,
      orderTakerId,
      customerId,
      notes,
      cashReceived,
      discount,
      tax,
      items,
    } = body;

    const order = await prisma.$transaction(async (tx) => {
      // If items are provided, update them
      if (items !== undefined) {
        await tx.orderItem.deleteMany({ where: { orderId } });
        if (items.length > 0) {
          const subtotal = items.reduce(
            (s: number, i: { price: number; quantity: number }) => s + i.price * i.quantity,
            0
          );
          const discountAmt = discount !== undefined ? parseFloat(discount) : 0;
          const taxAmt = tax !== undefined ? parseFloat(tax) : 0;
          const total = subtotal - discountAmt + taxAmt;
          await tx.order.update({
            where: { id: orderId },
            data: {
              subtotal,
              discount: discountAmt,
              tax: taxAmt,
              total,
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
          });
        }
      }

      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          ...(status !== undefined && { status }),
          ...(riderId !== undefined && { riderId: riderId || null }),
          ...(orderTakerId !== undefined && { orderTakerId: orderTakerId || null }),
          ...(customerId !== undefined && { customerId: customerId || null }),
          ...(notes !== undefined && { notes }),
          ...(cashReceived !== undefined && { cashReceived: parseFloat(cashReceived) }),
        },
        include: {
          items: { include: { department: true } },
          table: true,
          customer: true,
          orderTaker: true,
          rider: true,
        },
      });

      // Handle table status changes
      if (status === "completed" || status === "cancelled") {
        if (updated.tableId) {
          await tx.restaurantTable.update({
            where: { id: updated.tableId },
            data: { status: "available", activeOrderId: null },
          });
        }
      }

      return updated;
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id);
    if (isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (order?.tableId) {
      await prisma.restaurantTable.update({
        where: { id: order.tableId },
        data: { status: "available", activeOrderId: null },
      });
    }
    await prisma.orderItem.deleteMany({ where: { orderId } });
    await prisma.order.delete({ where: { id: orderId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete order" }, { status: 500 });
  }
}
