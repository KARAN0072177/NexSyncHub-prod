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

import { createSecurityLog } from "@/lib/security";

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
            otp,
        } = body;

        // 🔥 Validate
        if (
            !email?.trim() ||

            !otp?.trim()
        ) {

            return NextResponse.json(
                {
                    error:
                        "Email and OTP are required",
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
                        "Invalid OTP",
                },
                {
                    status: 400,
                }
            );

        }

        // 🔥 Get latest token
        const resetToken =

            await PasswordResetToken
                .findOne({

                    user: user._id,

                })

                .sort({
                    createdAt: -1,
                });

        if (!resetToken) {

            return NextResponse.json(
                {
                    error:
                        "OTP expired or invalid",
                },
                {
                    status: 400,
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
                        "OTP expired",
                },
                {
                    status: 400,
                }
            );

        }

        // 🔥 Compare hash
        const isMatch =
            await bcrypt.compare(

                otp,

                resetToken.otpHash
            );

        if (!isMatch) {

            return NextResponse.json(
                {
                    error:
                        "Invalid OTP",
                },
                {
                    status: 400,
                }
            );

        }

        // ✅ Mark verified
        resetToken.verified = true;

        await resetToken.save();

        // 🔥 Request info
        const ip =
            req.headers.get(
                "x-forwarded-for"
            ) || "Unknown IP";

        const userAgent =
            req.headers.get(
                "user-agent"
            ) || "Unknown Device";

        // 🔥 Create security log
        const securityLog =
            await createSecurityLog({

                userId:
                    user._id.toString(),

                action:
                    "password_reset_otp_verified",

                metadata: {

                    ip,
                    userAgent,

                },

            });

        // 🔥 Emit realtime event
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
                            "security-log-created",

                        data:
                            securityLog,

                    }),

            }
        );

        return NextResponse.json({

            success: true,

            message:
                "OTP verified successfully",

        });

    } catch (error) {

        console.error(
            "VERIFY RESET OTP ERROR:",
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