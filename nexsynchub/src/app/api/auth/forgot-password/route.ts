import { NextResponse }
    from "next/server";

import bcrypt
    from "bcryptjs";

import { connectDB }
    from "@/lib/db";

import User
    from "@/models/User";

import PasswordResetToken
    from "@/models/PasswordResetToken";

import {
    generateOTP,
} from "@/lib/generate-otp";

import { resend }
    from "@/lib/resend";

import { createSecurityLog, verifyTurnstile } from "@/lib/security";

export async function POST(
    req: Request
) {

    try {

        await connectDB();

        // 🔥 Parse body
        const body = await req.json();
        const { email, turnstileToken } = body;

        const ip = req.headers.get("x-forwarded-for") || "Unknown IP";

        // Verify Captcha
        try {
            await verifyTurnstile(turnstileToken, ip);
        } catch (err: any) {
            return NextResponse.json({ error: err.message }, { status: 400 });
        }

        const normalizedEmail =
            String(email || "")
                .trim()
                .toLowerCase();

        // 🔥 Validate email
        if (!normalizedEmail) {

            return NextResponse.json(
                {
                    error:
                        "Email is required",
                },
                {
                    status: 400,
                }
            );

        }

        // 🔥 Find user
        const user =
            await User.findOne({

                email:
                    normalizedEmail,

            });

        // 🔒 Generic response
        // Prevent account enumeration
        if (!user) {

            return NextResponse.json({

                success: true,

                message:

                    "If an account exists, an OTP has been sent.",

            });

        }

        // 🔥 Delete old OTPs
        await PasswordResetToken.deleteMany({

            user: user._id,

        });

        // 🔥 Generate OTP
        const otp =
            generateOTP();

        // 🔥 Hash OTP
        const otpHash =
            await bcrypt.hash(
                otp,
                10
            );

        // 🔥 Expiry
        const expiresAt =
            new Date(

                Date.now() +

                1000 * 60 * 10
            );

        // 🔥 Save token
        await PasswordResetToken.create({

            user: user._id,

            otpHash,

            expiresAt,

        });

        // 🔥 Send email
        await resend.emails.send({

            from:
                process.env.RESEND_FROM_EMAIL ||
                "NexSyncHub <noreply@karanart.com>",

            to: user.email,

            subject:
                "Reset your NexSyncHub password",

            html: `

        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px;">

          <h2>
            Reset Your Password
          </h2>

          <p>
            We received a request to reset your NexSyncHub password.
          </p>

          <p>
            Your OTP code is:
          </p>

          <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; margin: 24px 0;">
            ${otp}
          </div>

          <p>
            This OTP will expire in 10 minutes.
          </p>

          <p>
            If you did not request this, you can safely ignore this email.
          </p>

        </div>

      `,

        });

        // 🔥 Request info

        const userAgent =
            req.headers.get(
                "user-agent"
            ) || "Unknown Device";

        // 🔥 Create security log
        await createSecurityLog({

                userId:
                    user._id.toString(),

                action:
                    "password_reset_requested",

                metadata: {

                    ip,
                    userAgent,

                },

            });

        // 🔥 Emit realtime event
        return NextResponse.json({

            success: true,

            message:

                "If an account exists, an OTP has been sent.",

        });

    } catch (error) {

        console.error(
            "FORGOT PASSWORD ERROR:",
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
