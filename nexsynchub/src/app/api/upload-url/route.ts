import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
});

export async function POST(req: Request) {
  const { fileName, fileType } = await req.json();

  if (!fileName || !fileType) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const key = `${Date.now()}-${fileName}`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: key,
    ContentType: fileType,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 });

  return NextResponse.json({
    uploadUrl,
    key,
  });
}