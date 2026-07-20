import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");
    if (key) {
      const config = await prisma.systemConfig.findUnique({ where: { key } });
      // Never expose password hashes
      if (config && (key.includes("password"))) {
        return NextResponse.json({ key, exists: true });
      }
      return NextResponse.json(config);
    }
    // Return all non-sensitive configs
    const configs = await prisma.systemConfig.findMany({
      where: { key: { not: { contains: "password" } } },
    });
    return NextResponse.json(configs);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch config" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { key, value, isPassword } = body;
    if (!key || value === undefined) {
      return NextResponse.json({ error: "key and value required" }, { status: 400 });
    }
    const finalValue = isPassword ? bcrypt.hashSync(value, 10) : value;
    const config = await prisma.systemConfig.upsert({
      where: { key },
      update: { value: finalValue },
      create: { key, value: finalValue },
    });
    return NextResponse.json({ key: config.key, updated: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update config" }, { status: 500 });
  }
}
