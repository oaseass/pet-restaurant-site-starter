import type { DefaultSession } from "next-auth";
import type { AdminRole } from "@/lib/admin-access-config";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      email: string;
      roles: AdminRole[];
    };
  }

  interface User {
    roles: AdminRole[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    roles?: AdminRole[];
  }
}