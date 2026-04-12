import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
});

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const key = `${Date.now()}-${file.name}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    })
  );

  const url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;


// Determine the file type based on the MIME type of the uploaded file

let fileType: "image" | "video" | "file" = "file";  // Default to "file" if it's neither an image nor a video

if (file.type.startsWith("image")) {
  fileType = "image";
} else if (file.type.startsWith("video")) {
  fileType = "video";
}

return NextResponse.json({
  url,
  type: fileType, // ✅ FIXED
  name: file.name,
  size: file.size,
});
}