import {

  S3Client,
  PutObjectCommand,

} from "@aws-sdk/client-s3";

const s3 =
  new S3Client({

    region:
      process.env.AWS_REGION,

  });

export async function
uploadModerationEvidence({

  buffer,
  fileName,
  contentType,

}: {

  buffer: Buffer;

  fileName: string;

  contentType: string;

}) {

  // 🔥 Evidence path
  const key =

    `moderation-evidence/${Date.now()}-${fileName}`;

  // 🔥 Upload
  await s3.send(

    new PutObjectCommand({

      Bucket:
        process.env.AWS_BUCKET_NAME!,

      Key:
        key,

      Body:
        buffer,

      ContentType:
        contentType,

    })

  );

  const url =

    `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

  return {

    url,
    key,

  };

}