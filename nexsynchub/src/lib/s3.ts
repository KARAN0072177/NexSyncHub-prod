// src/lib/s3.ts
// 🔥 S3 client and signed URL generator

import {

  S3Client,

  GetObjectCommand,

} from "@aws-sdk/client-s3";

import {
  redis,
} from "@/lib/redis";

import {

  getSignedUrl,

} from "@aws-sdk/s3-request-presigner";

// 🔥 S3 client
export const s3 =
  new S3Client({

    region:
      process.env.AWS_REGION,

    credentials: {

      accessKeyId:
        process.env
          .AWS_ACCESS_KEY_ID!,

      secretAccessKey:
        process.env
          .AWS_SECRET_ACCESS_KEY!,

    },

  });

// 🔥 Generate signed URL
export async function
  getSignedFileUrl(
    key: string
  ) {

  const command =
    new GetObjectCommand({

      Bucket:
        process.env
          .AWS_BUCKET_NAME!,

      Key:
        key,

    });

  return await getSignedUrl(

    s3,

    command,

    {

      expiresIn:
        60 * 5, // 5 minutes

    }

  );

}

export async function
getCachedSignedFileUrl(
  key: string
) {

  const cacheKey =
    `signed-url:${key}`;

  // 🔥 Check cache
  const cachedUrl =
    await redis.get<string>(
      cacheKey
    );

  // ✅ Return cached
  if (cachedUrl) {

    return cachedUrl;

  }

  // 🔥 Generate new URL
  const signedUrl =
    await getSignedFileUrl(
      key
    );

  // 🔥 Cache for 4 minutes
  await redis.set(

    cacheKey,

    signedUrl,

    {

      ex:
        60 * 4,

    }

  );

  return signedUrl;

}