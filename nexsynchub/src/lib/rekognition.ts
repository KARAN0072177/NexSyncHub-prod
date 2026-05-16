import {
  RekognitionClient,
} from "@aws-sdk/client-rekognition";

export const rekognition =
  new RekognitionClient({

    region:
      process.env.AWS_REGION,

    credentials: {

      accessKeyId:
        process.env.AWS_ACCESS_KEY_ID!,

      secretAccessKey:
        process.env.AWS_SECRET_ACCESS_KEY!,

    },

  });