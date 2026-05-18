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

import { resend }
  from "@/lib/resend";

export async function POST(
  req: Request
) {

  try {

    await connectDB();

    // 🔥 Parse body
    const body =
      await req.json();

    const {
      email,
      password,
      confirmPassword,
    } = body;

    // 🔥 Validate fields
    if (

      !email?.trim() ||

      !password?.trim() ||

      !confirmPassword?.trim()

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

    // 🔥 Password match
    if (
      password !==
      confirmPassword
    ) {

      return NextResponse.json(
        {
          error:
            "Passwords do not match",
        },
        {
          status: 400,
        }
      );

    }

    // 🔥 Password length
    if (
      password.length < 6
    ) {

      return NextResponse.json(
        {
          error:
            "Password must be at least 6 characters",
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
          email.toLowerCase(),

      });

    if (!user) {

      return NextResponse.json(
        {
          error:
            "Invalid request",
        },
        {
          status: 400,
        }
      );

    }

    // 🔥 Find verified token
    const resetToken =

      await PasswordResetToken
        .findOne({

          user: user._id,

          verified: true,

        })

        .sort({
          createdAt: -1,
        });

    if (!resetToken) {

      return NextResponse.json(
        {
          error:
            "OTP verification required",
        },
        {
          status: 403,
        }
      );

    }

    // 🔥 Expiry check
    if (

      new Date() >

      resetToken.expiresAt

    ) {

      return NextResponse.json(
        {
          error:
            "Reset session expired",
        },
        {
          status: 400,
        }
      );

    }

    // 🔥 Hash new password
    const hashedPassword =
      await bcrypt.hash(
        password,
        10
      );

    // 🔥 Update password
    user.password =
      hashedPassword;

    await user.save();

    // 🔥 Delete ALL reset tokens
    await PasswordResetToken.deleteMany({

      user: user._id,

    });

    // 🔥 Get request info
    const ip =
      req.headers.get(
        "x-forwarded-for"
      ) || "Unknown IP";

    const userAgent =
      req.headers.get(
        "user-agent"
      ) || "Unknown Device";

    // 🔥 Send security email
    await resend.emails.send({

      from:
        "NexSyncHub <onboarding@resend.dev>",

      to: user.email,

      subject:
        "Your NexSyncHub password was changed",

      html: `

        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px;">

          <h2>
            Password Changed Successfully
          </h2>

          <p>
            Your NexSyncHub password was changed successfully.
          </p>

          <div style="margin-top: 20px;">

            <p>
              <strong>Time:</strong>
              ${new Date().toLocaleString()}
            </p>

            <p>
              <strong>IP Address:</strong>
              ${ip}
            </p>

            <p>
              <strong>Device:</strong>
              ${userAgent}
            </p>

          </div>

          <p style="margin-top: 24px;">
            If this wasn't you, please secure your account immediately.
          </p>

        </div>

      `,

    });

    return NextResponse.json({

      success: true,

      message:
        "Password reset successful",

    });

  } catch (error) {

    console.error(
      "RESET PASSWORD ERROR:",
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