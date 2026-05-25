// src/app/api/upload/route.ts

// This API route handles file uploads to AWS S3. It accepts a file from the request, uploads it to S3, and returns the URL of the uploaded file along with its type (image, video, or file), name, and size.

import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { uploadModerationEvidence } from "@/lib/upload-moderation-evidence";

import {
  moderateImage,
} from "@/lib/moderation";

import {
  createSecurityLog,
} from "@/lib/security";

import { requireAuth } from "@/lib/auth-guard";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
});

export async function POST(req: Request) {

  // 🔐 Session
  const session =
    await requireAuth();

  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // 🔥 Moderate image uploads
  if (
    file.type.startsWith(
      "image/"
    )
  ) {

    const moderation =
      await moderateImage(
        buffer
      );

    // ❌ Unsafe image
    if (!moderation.safe) {

      // 🔥 Upload moderation evidence
      const evidence =

        await uploadModerationEvidence({

          buffer,

          fileName:
            file.name,

          contentType:
            file.type,

        });

      // 🔥 Security log
      const securityLog =
        await createSecurityLog({

          userId:
            session?.user?.id,

          action:
            "unsafe_chat_attachment",

          metadata: {

            filename:
              file.name,

            size:
              file.size,

            contentType:
              file.type,

            moderationLabels:

              moderation.labels

                .filter(
                  (label: any) =>

                    label.Confidence >= 70
                )

                .map(
                  (label: any) => ({

                    name:
                      label.Name,

                    confidence:
                      label.Confidence,

                    parentName:
                      label.ParentName,

                  })),

            evidenceUrl:
              evidence.url,

            evidenceKey:
              evidence.key,

            evidenceExpiresAt:
              new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
          },

        });

      // 🔥 Realtime admin event
      await fetch(
        "http://localhost:4000/emit",
        {

          method: "POST",

          headers: {

            "Content-Type":
              "application/json",

          },

          body:
            JSON.stringify({

              channelId:
                "admin_global",

              event:
                "admin_security_log_created",

              data:
                securityLog,

            }),

        }
      );

      return NextResponse.json(

        {

          error:

            "Chat attachments must follow community guidelines.",

        },

        {

          status: 400,

        }

      );

    }

  }

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
    key,
    type: fileType, // ✅ FIXED
    name: file.name,
    size: file.size,
  });
}