import { NextResponse } from "next/server";

import { getServerSession } from "next-auth";

import {
  PutObjectCommand,
} from "@aws-sdk/client-s3";

import { authOptions } from "@/lib/auth-options";
import { connectDB } from "@/lib/db";
import { s3 } from "@/lib/s3";

import User from "@/models/User";

export async function POST(
  req: Request
) {

  try {

    await connectDB();

    // 🔐 Auth check
    const session =
      await getServerSession(
        authOptions
      );

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

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

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );

  }

}