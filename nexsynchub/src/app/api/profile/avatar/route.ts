import { NextResponse } from "next/server";

import {
  moderateImage,
} from "@/lib/moderation";

import {
  PutObjectCommand,
} from "@aws-sdk/client-s3";

import { connectDB } from "@/lib/db";
import { s3 } from "@/lib/s3";

import { requireAuth } from "@/lib/auth-guard";

import User from "@/models/User";

import {
  createSecurityLog,
} from "@/lib/security";
import { handleApiError } from "@/lib/api-error";

export async function POST(
  req: Request
) {

  try {

    await connectDB();

    const ip =

      req.headers.get(
        "x-forwarded-for"
      )

      ||

      "Unknown";

    const userAgent =

      req.headers.get(
        "user-agent"
      )

      ||

      "Unknown";

    // 🔐 Auth check
    const session =
      await requireAuth();

    // 🔥 Parse form data
    const formData =
      await req.formData();

    const file =
      formData.get("avatar") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    // 🔥 Validate type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (
      !allowedTypes.includes(file.type)
    ) {
      return NextResponse.json(
        {
          error:
            "Only JPG, PNG, and WEBP allowed",
        },
        { status: 400 }
      );
    }

    // 🔥 Validate size (5MB)
    const MAX_SIZE =
      5 * 1024 * 1024;

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        {
          error:
            "Image must be under 5MB",
        },
        { status: 400 }
      );
    }

    // 🔥 Convert file to buffer
    const bytes =
      await file.arrayBuffer();

    const buffer =
      Buffer.from(bytes);

    // 🔥 Moderate image
    const moderation =
      await moderateImage(
        buffer
      );

    console.log(
      moderation.labels
    );

    // ❌ Unsafe image
    // ❌ Unsafe image
    if (!moderation.safe) {

      // 🔥 Security log
      await createSecurityLog({

        userId:
          session.user.id,

        action:
          "unsafe_avatar_upload",

        ip,

        userAgent,

        metadata: {

          filename:
            file.name,

          mimeType:
            file.type,

          size:
            file.size,

          moderationLabels:

            moderation.labels.map(
              (label) => ({

                name:
                  label.Name,

                confidence:
                  label.Confidence,

                parent:
                  label.ParentName,

              })
            ),

        },

      });

      return NextResponse.json(
        {
          error:
            "This image violates our community guidelines. Please upload a different image.",
        },
        {
          status: 400,
        }
      );

    }

    // 🔥 Generate unique key
    const extension =
      file.name.split(".").pop();

    const key =
      `avatars/${session.user.id}/avatar-${Date.now()}.${extension}`;

    // 🔥 Upload to S3
    await s3.send(
      new PutObjectCommand({

        Bucket:
          process.env.AWS_BUCKET_NAME!,

        Key: key,

        Body: buffer,

        ContentType: file.type,

      })
    );

    // 🔥 Generate public URL
    const avatarUrl =
      `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    // 🔥 Save to DB
    const user =
      await User.findByIdAndUpdate(
        session.user.id,

        {
          avatar: avatarUrl,
        },

        {
          new: true,
        }
      );

    return NextResponse.json({
      success: true,

      avatar: user?.avatar,
    });

  } catch (error) {

    console.error(
      "AVATAR UPLOAD ERROR:",
      error
    );

    return handleApiError(
      error
    );
  }

}