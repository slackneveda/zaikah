import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    if (!user.active) {
      return NextResponse.json({ error: "Account is inactive. Contact your administrator." }, { status: 403 });
    }

    if (user.role !== "admin") {
      return NextResponse.json({ error: "Access denied. Admin credentials required." }, { status: 403 });
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
