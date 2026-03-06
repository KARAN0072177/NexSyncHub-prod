import { createSchema } from "graphql-yoga";
import { registerUser } from "./resolvers/auth/registerUser";
import { verifyEmail } from "./resolvers/auth/verifyEmail";
import { setupUsername } from "./resolvers/auth/setupUsername";
import { loginUser } from "./resolvers/auth/loginUser";
import { me } from "./resolvers/auth/me";
import { logout } from "./resolvers/auth/logout";
import { requestPasswordReset } from "./resolvers/auth/requestPasswordReset";
import { verifyResetOtp } from "./resolvers/auth/verifyResetOtp";
import { resetPassword } from "./resolvers/auth/resetPassword";

export const schema = createSchema({
  typeDefs: /* GraphQL */ `
    type User {
      id: ID!
      email: String!
      username: String
      lastLoginProvider: String
      accounts: [Account!]
    }

    type Query {
      hello: String!
      me: User
    }

    type Account {
      provider: String!
      providerAccountId: String!
  }

    type Mutation {
      registerUser(email: String!, password: String!): User!
      verifyEmail(token: String!): Boolean!
      setupUsername(email: String!, username: String!): User!
      loginUser(identifier: String!, password: String!): User!
      logout: Boolean!
      requestPasswordReset(identifier: String!): Boolean!
      verifyResetOtp(email: String!, otp: String!): Boolean!
      resetPassword(email: String!, password: String!): Boolean!
    }
  `,
  resolvers: {
    Query: {
      hello: () => "NexSyncHub GraphQL API running 🚀",
      me
    },
    Mutation: {
      registerUser,
      verifyEmail,
      setupUsername,
      loginUser,
      logout,
      requestPasswordReset,
      verifyResetOtp,
      resetPassword
    },
  },
});