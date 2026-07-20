import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export type UserRole = "admin" | "manager" | "dining" | "takeaway" | "delivery";

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  manager: "Manager",
  dining: "Dining",
  takeaway: "Takeaway",
  delivery: "Home Delivery",
};

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: ["admin", "manager", "dining", "takeaway", "delivery"],
  manager: ["manager", "dining", "takeaway", "delivery"],
  dining: ["dining"],
  takeaway: ["takeaway"],
  delivery: ["delivery"],
};

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export async function verifyMasterPassword(password: string): Promise<boolean> {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: "master_password" },
    });
    if (!config) return false;
    return bcrypt.compareSync(password, config.value);
  } catch {
    return false;
  }
}

export async function verifyRolePassword(
  role: UserRole,
  password: string
): Promise<boolean> {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: `role_password_${role}` },
    });
    if (!config) return false;
    return bcrypt.compareSync(password, config.value);
  } catch {
    return false;
  }
}

export async function verifyUserLogin(
  email: string,
  password: string
): Promise<SessionUser | null> {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.active) return null;
    if (!bcrypt.compareSync(password, user.password)) return null;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as UserRole,
    };
  } catch {
    return null;
  }
}
