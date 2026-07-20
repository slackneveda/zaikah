import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, role, rolePassword, masterPassword } = body;

    // Role-based login (no email needed)
    if (role && rolePassword !== undefined) {
      // Map portal IDs to DB config keys
      const roleKeyMap: Record<string, string> = {
        "dine-in": "dining",
        "home-delivery": "delivery",
      };
      const normalizedRole = roleKeyMap[role] ?? role;
      const config = await prisma.systemConfig.findUnique({
        where: { key: `role_password_${normalizedRole}` },
      });
      if (!config || !bcrypt.compareSync(rolePassword, config.value)) {
        return NextResponse.json({ error: "Invalid password for this role" }, { status: 401 });
      }
      // Find a user for this role or return synthetic session
      const user = await prisma.user.findFirst({
        where: { role: normalizedRole, active: true },
      });
      return NextResponse.json({
        id: user?.id ?? 0,
        name: user?.name ?? normalizedRole.charAt(0).toUpperCase() + normalizedRole.slice(1),
        email: user?.email ?? `${normalizedRole}@zaikah.com`,
        role,  // return original portal id so session.role matches route guards
      });
    }

    // Master password verification
    if (masterPassword !== undefined) {
      const config = await prisma.systemConfig.findUnique({
        where: { key: "master_password" },
      });
      if (!config || !bcrypt.compareSync(masterPassword, config.value)) {
        return NextResponse.json({ error: "Invalid master password" }, { status: 401 });
      }
      return NextResponse.json({ verified: true });
    }

    // Email/password login
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
