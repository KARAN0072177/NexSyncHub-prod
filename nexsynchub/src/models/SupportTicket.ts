import {
    Schema,
    model,
    models,
} from "mongoose";

const SupportTicketSchema =
    new Schema(

        {

            // 🔥 User
            user: {

                type:
                    Schema.Types.ObjectId,

                ref:
                    "User",

                required:
                    true,

            },

            // 🔥 Category
            category: {

                type:
                    String,

                required:
                    true,

                enum: [

                    "general",

                    "bug_report",

                    "feedback",

                    "feature_request",

                    "workspace_report",

                    "account_support",

                    "billing",

                    "other",

                ],

            },

            // 🔥 Subject
            subject: {

                type:
                    String,

                required:
                    true,

                trim:
                    true,

                maxlength:
                    120,

            },

            // 🔥 Main message
            message: {

                type:
                    String,

                required:
                    true,

                trim:
                    true,

                maxlength:
                    5000,

            },

            // 🔥 Ticket status
            status: {

                type:
                    String,

                enum: [

                    "open",

                    "in_progress",

                    "resolved",

                    "closed",

                ],

                default:
                    "open",

            },

            // 🔥 Priority
            priority: {

                type:
                    String,

                enum: [

                    "low",

                    "medium",

                    "high",

                    "critical",

                ],

                default:
                    "medium",

            },

            // 🔥 Attachments
            attachments: [

                {

                    filename:
                        String,

                    key:
                        String,

                    size:
                        Number,

                    mimeType:
                        String,

                },

            ],

            // 🔥 Admin notes
            adminNotes: {

                type:
                    String,

                default:
                    "",

            },

            // 🔥 Resolution message
            resolutionMessage: {

                type:
                    String,

                default:
                    "",

            },

            // 🔥 Unread Status
            hasUnreadAdminReply: {
                type: Boolean,
                default: false,
            },

            // 🔥 Admin who handled it
            adminFollowUps: [

                {

                    message: {

                        type:
                            String,

                        required:
                            true,

                        trim:
                            true,

                        maxlength:
                            5000,

                    },

                    sentAt: {

                        type:
                            Date,

                        default:
                            Date.now,

                    },

                    sentBy: {

                        type:
                            Schema.Types.ObjectId,

                        ref:
                            "User",

                    },

                },

            ],

            userReplies: [

                {

                    message: {

                        type:
                            String,

                        required:
                            true,

                        trim:
                            true,

                        maxlength:
                            5000,

                    },

                    sentAt: {

                        type:
                            Date,

                        default:
                            Date.now,

                    },

                },

            ],

            handledBy: {

                type:
                    Schema.Types.ObjectId,

                ref:
                    "User",

            },

        },

        {

            timestamps:
                true,

        }

    );

const SupportTicket =

    models.SupportTicket ||

    model(

        "SupportTicket",

        SupportTicketSchema

    );

export default SupportTicket;
