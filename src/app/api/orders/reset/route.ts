import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE() {
  try {
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to reset orders" }, { status: 500 });
  }
}
