import { createSchema } from "graphql-yoga";
import { registerUser } from "./resolvers/auth/registerUser";

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
    }
  `,
  resolvers: {
    Query: {
      hello: () => "NexSyncHub GraphQL API is running 🚀",
    },
    Mutation: {
      registerUser,
    },
  },
});