import { NextResponse }
  from "next/server";

import { getServerSession }
  from "next-auth";

import {
  PutObjectCommand,
} from "@aws-sdk/client-s3";

import {
  authOptions,
} from "@/lib/auth-options";

import {
  connectDB,
} from "@/lib/db";

import {
  s3,
} from "@/lib/s3";

import { resend }
  from "@/lib/resend";

import SupportTicket
  from "@/models/SupportTicket";

export async function POST(
  req: Request
) {

  try {

    await connectDB();

    // 🔐 Session
    const session =
      await getServerSession(
        authOptions
      );

    if (!session?.user?.id) {

      return NextResponse.json(
        {
          error:
            "Unauthorized",
        },
        {
          status: 401,
        }
      );

    }

    // 🔥 Parse form data
    const formData =
      await req.formData();

    const category =
      formData.get(
        "category"
      ) as string;

    const subject =
      formData.get(
        "subject"
      ) as string;

    const message =
      formData.get(
        "message"
      ) as string;

    const files =
      formData.getAll(
        "attachments"
      ) as File[];

    // 🔥 Validate
    if (
      !category ||
      !subject?.trim() ||
      !message?.trim()
    ) {

      return NextResponse.json(
        {
          error:
            "All fields are required",
        },
        {
          status: 400,
        }
      );

    }

    // 🔥 Allowed categories
    const allowedCategories = [

      "general",

      "bug_report",

      "feedback",

      "feature_request",

      "workspace_report",

      "account_support",

      "billing",

      "other",

    ];

    if (
      !allowedCategories.includes(
        category
      )
    ) {

      return NextResponse.json(
        {
          error:
            "Invalid category",
        },
        {
          status: 400,
        }
      );

    }

    // 🔥 Validate attachment types
    const allowedTypes = [

      "image/jpeg",
      "image/png",
      "image/webp",

      "application/pdf",

      "text/plain",

      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

    ];

    // 🔥 Upload attachments
    const uploadedAttachments =
      [];

    for (
      const file of files
    ) {

      if (
        !(file instanceof File)
      ) continue;

      // ❌ Type check
      if (
        !allowedTypes.includes(
          file.type
        )
      ) {

        return NextResponse.json(
          {
            error:
              `Unsupported file type: ${file.name}`,
          },
          {
            status: 400,
          }
        );

      }

      // ❌ Size limit
      const MAX_SIZE =
        10 * 1024 * 1024;

      if (
        file.size > MAX_SIZE
      ) {

        return NextResponse.json(
          {
            error:
              `${file.name} exceeds 10MB limit`,
          },
          {
            status: 400,
          }
        );

      }

      // 🔥 Convert buffer
      const bytes =
        await file.arrayBuffer();

      const buffer =
        Buffer.from(bytes);

      // 🔥 Generate key
      const extension =
        file.name
          .split(".")
          .pop();

      const key =
        `support-attachments/${session.user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

      // 🔥 Upload to S3
      await s3.send(
        new PutObjectCommand({

          Bucket:
            process.env
              .AWS_BUCKET_NAME!,

          Key:
            key,

          Body:
            buffer,

          ContentType:
            file.type,

        })
      );

      // 🔥 Public URL
      const url =
        `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

      uploadedAttachments.push({

        filename:
          file.name,

        url,

        size:
          file.size,

        mimeType:
          file.type,

      });

    }

    // 🔥 Create ticket
    const ticket =
      await SupportTicket.create({

        user:
          session.user.id,

        category,

        subject:
          subject.trim(),

        message:
          message.trim(),

        attachments:
          uploadedAttachments,

      });

    // 🔥 Send admin email
    await resend.emails.send({

      from:
        "NexSyncHub Support <support@karanart.com>",

      to:
        process.env
          .SUPPORT_EMAIL!,

      subject:
        `New Support Ticket - ${subject}`,

      html: `

        <div style="font-family: Arial, sans-serif; padding: 24px;">

          <h2>
            New Support Ticket
          </h2>

          <p>
            <strong>Category:</strong>
            ${category}
          </p>

          <p>
            <strong>Subject:</strong>
            ${subject}
          </p>

          <p>
            <strong>Message:</strong>
          </p>

          <div style="padding:16px;background:#f5f5f5;border-radius:8px;">
            ${message}
          </div>

        </div>

      `,

    });

    // 🔥 Confirmation email
    await resend.emails.send({

      from:
        "NexSyncHub <noreply@karanart.com>",

      to:
        session.user.email!,

      subject:
        "We received your support request",

      html: `

        <div style="font-family: Arial, sans-serif; padding: 24px;">

          <h2>
            Support Request Received
          </h2>

          <p>
            Thanks for contacting NexSyncHub support.
          </p>

          <p>
            Our team has received your request and will review it shortly.
          </p>

          <p>
            <strong>Subject:</strong>
            ${subject}
          </p>

        </div>

      `,

    });

    return NextResponse.json({

      success: true,

      ticketId:
        ticket._id,

    });

  } catch (error) {

    console.error(
      "SUPPORT CREATE ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong",
      },
      {
        status: 500,
      }
    );

  }

}