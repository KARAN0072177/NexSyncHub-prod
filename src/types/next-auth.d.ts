import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    username?: string | null;
  }

  interface Session {
    user: {
      id: string;
      username?: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username?: string | null;
  }
}