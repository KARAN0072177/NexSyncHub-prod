import { NextResponse }
  from "next/server";

import { getServerSession }
  from "next-auth";

import {
  authOptions,
} from "@/lib/auth-options";

import {
  connectDB,
} from "@/lib/db";

import {
  requireAdmin,
} from "@/lib/permissions";

import SupportTicket
  from "@/models/SupportTicket";

import { resend }
  from "@/lib/resend";

export async function PATCH(
  req: Request
) {

  try {

    await connectDB();

    // 🔐 Session
    const session =
      await getServerSession(
        authOptions
      );

    if (
      !session?.user?.id
    ) {

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

    // 🔐 Admin check
    await requireAdmin(
      session.user.id
    );

    // 🔥 Parse body
    const body =
      await req.json();

    const {

      ticketId,

      status,

      adminNotes,

      resolutionMessage,

    } = body;

    // ❌ Validate
    if (!ticketId) {

      return NextResponse.json(
        {
          error:
            "Ticket ID required",
        },
        {
          status: 400,
        }
      );

    }

    // 🔥 Allowed statuses
    const allowedStatuses = [

      "open",

      "in_progress",

      "resolved",

      "closed",

    ];

    if (
      status &&
      !allowedStatuses.includes(
        status
      )
    ) {

      return NextResponse.json(
        {
          error:
            "Invalid status",
        },
        {
          status: 400,
        }
      );

    }

    // 🔥 Existing ticket
    const existingTicket =
      await SupportTicket.findById(
        ticketId
      )

        .populate(
          "user",
          "username email"
        );

    if (!existingTicket) {

      return NextResponse.json(
        {
          error:
            "Ticket not found",
        },
        {
          status: 404,
        }
      );

    }

    const oldStatus =
      existingTicket.status;

    // 🔥 Update ticket
    const ticket =
      await SupportTicket.findByIdAndUpdate(

        ticketId,

        {

          ...(status && {
            status,
          }),

          ...(adminNotes !== undefined && {

            adminNotes,

          }),

          ...(resolutionMessage !== undefined && {

            resolutionMessage,

          }),

          handledBy:
            session.user.id,

        },

        {
          new: true,
        }

      )

        .populate(

          "user",

          "username email avatar role"

        )

        .populate(

          "handledBy",

          "username email avatar"

        );

    // 🔥 Send user email
    const userEmail =
      existingTicket.user?.email;

    if (userEmail) {

      // 🔥 IN PROGRESS
      if (

        oldStatus !==
          "in_progress"

        &&

        status ===
          "in_progress"

      ) {

        await resend.emails.send({

          from:
            "NexSyncHub Support <support@karanart.com>",

          to:
            userEmail,

          subject:
            "Your support request is being reviewed",

          html: `

            <div style="font-family: Arial, sans-serif; padding: 24px;">

              <h2>
                Support Request Update
              </h2>

              <p>
                Our support team is now reviewing your request.
              </p>

              <p>
                <strong>Subject:</strong>
                ${existingTicket.subject}
              </p>

              <p>
                We may contact you if additional information is needed.
              </p>

            </div>

          `,

        });

      }

      // 🔥 RESOLVED
      if (

        oldStatus !==
          "resolved"

        &&

        status ===
          "resolved"

      ) {

        await resend.emails.send({

          from:
            "NexSyncHub Support <support@karanart.com>",

          to:
            userEmail,

          subject:
            "Your support request has been resolved",

          html: `

            <div style="font-family: Arial, sans-serif; padding: 24px;">

              <h2>
                Support Request Resolved
              </h2>

              <p>
                Your support request has been marked as resolved.
              </p>

              <p>
                <strong>Subject:</strong>
                ${existingTicket.subject}
              </p>

              ${resolutionMessage ? `

                <div style="margin-top:16px;padding:16px;background:#f5f5f5;border-radius:8px;">

                  <strong>
                    Resolution Message:
                  </strong>

                  <p style="margin-top:8px;">
                    ${resolutionMessage}
                  </p>

                </div>

              ` : ""}

            </div>

          `,

        });

      }

      // 🔥 CLOSED
      if (

        oldStatus !==
          "closed"

        &&

        status ===
          "closed"

      ) {

        await resend.emails.send({

          from:
            "NexSyncHub Support <support@karanart.com>",

          to:
            userEmail,

          subject:
            "Your support request has been closed",

          html: `

            <div style="font-family: Arial, sans-serif; padding: 24px;">

              <h2>
                Support Ticket Closed
              </h2>

              <p>
                Your support ticket has now been closed.
              </p>

              <p>
                <strong>Subject:</strong>
                ${existingTicket.subject}
              </p>

              <p>
                Thank you for contacting NexSyncHub support.
              </p>

            </div>

          `,

        });

      }

    }

    return NextResponse.json({

      success: true,

      ticket,

    });

  } catch (error) {

    console.error(
      "ADMIN SUPPORT UPDATE ERROR:",
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