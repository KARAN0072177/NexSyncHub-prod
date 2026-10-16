import OpenAI
  from "openai";

export const openai =
  new OpenAI({

    apiKey:
      process.env
        .OPENAI_API_KEY || "dummy_openai_key_for_build",

  });