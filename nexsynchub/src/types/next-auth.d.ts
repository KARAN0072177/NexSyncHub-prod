import NextAuth, {
  DefaultSession,
} from "next-auth";

declare module "next-auth" {

  interface User {

    id: string;

    username?:
      string | null;

    avatar?:
      string | null;

    role:
      "user" |
      "admin" |
      "super_admin";

  }

  interface Session {

    user: {

      id: string;

      username?:
        string | null;

      avatar?:
        string | null;

      role:
        "user" |
        "admin" |
        "super_admin";

    } & DefaultSession["user"];

  }

}

declare module "next-auth/jwt" {

  interface JWT {

    id: string;

    username?:
      string | null;

    avatar?:
      string | null;

    role:
      "user" |
      "admin" |
      "super_admin";

  }

}