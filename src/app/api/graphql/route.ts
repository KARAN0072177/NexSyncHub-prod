import { createYoga } from "graphql-yoga";
import { schema } from "@/graphql/schema";
import { cookies } from "next/headers";

const yoga = createYoga({
  schema,
  graphqlEndpoint: "/api/graphql",
  fetchAPI: { Response },

  context: async () => {
    const cookieStore = await cookies();

    return {
      cookies: cookieStore,
    };
  },
});

export { yoga as GET, yoga as POST };