import { createSchema } from "graphql-yoga";
import { registerUser } from "./resolvers/auth/registerUser";
import { verifyEmail } from "./resolvers/auth/verifyEmail";

export const schema = createSchema({
  typeDefs: /* GraphQL */ `
    type User {
      id: ID!
      email: String!
    }

    type Query {
      hello: String!
    }

    type Mutation {
      registerUser(email: String!, password: String!): User!
      verifyEmail(token: String!): Boolean!
    }
  `,
  resolvers: {
    Query: {
      hello: () => "NexSyncHub GraphQL API running 🚀",
    },
    Mutation: {
      registerUser,
      verifyEmail,
    },
  },
});