// /src/app/api/admin/platform-settings/route.ts

import {
    NextRequest,
    NextResponse,
} from "next/server";

import {
    connectDB,
} from "@/lib/db";

import {
    requireAuth,
} from "@/lib/auth-guard";

import {
    requireSuperAdmin,
} from "@/lib/super-admin";

import {
    handleApiError,
} from "@/lib/api-error";

import {
    getPlatformSettings,
} from "@/lib/platform-settings";

import {
    redis,
} from "@/lib/redis";

export async function GET() {

    try {

        await connectDB();

        const session =
            await requireAuth();

        await requireSuperAdmin(
            session.user.id
        );

        const settings =
            await getPlatformSettings();

        return NextResponse.json({

            success: true,

            settings,

        });

    } catch (error) {

        return handleApiError(
            error
        );

    }

}

export async function PATCH(
    req: NextRequest
) {

    try {

        await connectDB();

        const session =
            await requireAuth();

        await requireSuperAdmin(
            session.user.id
        );

        const body =
            await req.json();

        const {

            allowRegistrations,

            maintenanceMode,

            announcementEnabled,

            announcementText,

            announcementType,

            announcementStartAt,

            announcementEndAt,

            allowWorkspaceInvites,

        } = body;

        const settings =
            await getPlatformSettings();

        // 🔥 Update only provided fields
        if (allowRegistrations !== undefined) {
            settings.allowRegistrations = allowRegistrations;
            await redis.set(
                "allow_registrations",
                allowRegistrations
            );
        }

        if (maintenanceMode !== undefined) {
            settings.maintenanceMode = maintenanceMode;
            await redis.set(
                "maintenance_mode",
                maintenanceMode
            );
        }

        if (announcementEnabled !== undefined) {
            await redis.set(
                "global_announcement",
                JSON.stringify({
                    enabled: announcementEnabled,
                    text: announcementText,
                    type: announcementType,
                    startAt: announcementStartAt,
                    endAt: announcementEndAt,
                })
            );

            settings.announcementEnabled = announcementEnabled;
            settings.announcementText = announcementText;
            settings.announcementType = announcementType;
            settings.announcementStartAt = announcementStartAt;
            settings.announcementEndAt = announcementEndAt;
        }

        if (allowWorkspaceInvites !== undefined) {
            settings.allowWorkspaceInvites = allowWorkspaceInvites;
            await redis.set(
                "allow_workspace_invites",
                allowWorkspaceInvites
            );
        }

        await settings.save();

        return NextResponse.json({

            success: true,

        });

    } catch (error) {

        return handleApiError(
            error
        );

    }

}