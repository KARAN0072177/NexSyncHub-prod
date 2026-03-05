import { createSchema } from "graphql-yoga";
import { registerUser } from "./resolvers/auth/registerUser";
import { verifyEmail } from "./resolvers/auth/verifyEmail";
import { setupUsername } from "./resolvers/auth/setupUsername";
import { loginUser } from "./resolvers/auth/loginUser";

export const schema = createSchema({
  typeDefs: /* GraphQL */ `
    type User {
      id: ID!
      email: String!
      username: String
    }

    type Query {
      hello: String!
    }

    type Mutation {
      registerUser(email: String!, password: String!): User!
      verifyEmail(token: String!): Boolean!
      setupUsername(email: String!, username: String!): User!
      loginUser(identifier: String!, password: String!): User!
    }
  `,
  resolvers: {
    Query: {
      hello: () => "NexSyncHub GraphQL API running 🚀",
    },
    Mutation: {
      registerUser,
      verifyEmail,
      setupUsername,
      loginUser,
    },
  },
});