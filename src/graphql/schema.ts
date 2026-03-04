import { createSchema } from "graphql-yoga";

export const schema = createSchema({
  typeDefs: /* GraphQL */ `
    type Query {
      hello: String!
    }

    type Mutation {
      _empty: String
    }
  `,
  resolvers: {
    Query: {
      hello: () => "NexSyncHub GraphQL API is running 🚀",
    },
  },
});