import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Range for charts: use provided dates or default to last 7 days
    const rangeStart = fromParam
      ? new Date(fromParam + "T00:00:00.000Z")
      : new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);
    const rangeEnd = toParam
      ? new Date(toParam + "T23:59:59.999Z")
      : tomorrow;

    const [rangeOrders, totalSalesResult, topItems] = await Promise.all([
      prisma.order.findMany({
        where: {
          createdAt: { gte: rangeStart, lte: rangeEnd },
          status: "completed",
        },
        include: { items: true },
      }),
      prisma.order.aggregate({
        where: {
          createdAt: { gte: rangeStart, lte: rangeEnd },
          status: "completed",
        },
        _sum: { total: true },
      }),
      prisma.orderItem.groupBy({
        by: ["name"],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
        where: {
          order: {
            createdAt: { gte: rangeStart, lte: rangeEnd },
            status: "completed",
          },
        },
      }),
    ]);

    const takeawayOrders = rangeOrders.filter((o) => o.type === "takeaway");
    const dineInOrders = rangeOrders.filter((o) => o.type === "dine-in");

    // Build daily revenue for the range
    const dailyRevenue: Record<string, number> = {};
    const msPerDay = 24 * 60 * 60 * 1000;
    const days = Math.min(
      Math.ceil((rangeEnd.getTime() - rangeStart.getTime()) / msPerDay),
      31
    );
    for (let i = 0; i < days; i++) {
      const d = new Date(rangeStart.getTime() + i * msPerDay);
      const key = d.toISOString().slice(0, 10);
      dailyRevenue[key] = 0;
    }
    rangeOrders.forEach((order) => {
      const key = order.createdAt.toISOString().slice(0, 10);
      if (dailyRevenue[key] !== undefined) {
        dailyRevenue[key] += order.total;
      }
    });

    return NextResponse.json({
      todayStats: {
        totalSales: totalSalesResult._sum.total ?? 0,
        completedOrders: rangeOrders.length,
        takeawayOrders: takeawayOrders.length,
        dineInOrders: dineInOrders.length,
      },
      dailyRevenue: Object.entries(dailyRevenue).map(([date, revenue]) => ({
        date,
        revenue,
      })),
      topItems: topItems.map((item) => ({
        name: item.name,
        quantity: item._sum.quantity ?? 0,
      })),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
