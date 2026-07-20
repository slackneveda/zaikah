import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, fromTableId, toTableId, transferredBy } = body;

    if (!orderId || !fromTableId || !toTableId) {
      return NextResponse.json(
        { error: "orderId, fromTableId, and toTableId are required" },
        { status: 400 }
      );
    }

    if (fromTableId === toTableId) {
      return NextResponse.json(
        { error: "Cannot transfer to the same table" },
        { status: 400 }
      );
    }

    // Check target table is available
    const toTable = await prisma.restaurantTable.findUnique({
      where: { id: toTableId },
    });
    if (!toTable) {
      return NextResponse.json({ error: "Target table not found" }, { status: 404 });
    }
    if (toTable.status === "occupied") {
      return NextResponse.json(
        { error: `Table ${toTable.name} is already occupied` },
        { status: 409 }
      );
    }

    // Execute transfer in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update order to point to new table
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { tableId: toTableId },
      });

      // Free the old table
      await tx.restaurantTable.update({
        where: { id: fromTableId },
        data: { status: "available", activeOrderId: null },
      });

      // Mark new table as occupied
      await tx.restaurantTable.update({
        where: { id: toTableId },
        data: { status: "occupied", activeOrderId: orderId },
      });

      // Record transfer
      await tx.tableTransfer.create({
        data: {
          orderId,
          fromTableId,
          toTableId,
          transferredBy: transferredBy || null,
        },
      });

      return updatedOrder;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Transfer failed" }, { status: 500 });
  }
}
