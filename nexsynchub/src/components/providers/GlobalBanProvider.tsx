"use client";

import {
    useEffect,
    useState,
} from "react";

import BannedModal
    from "../modal/BannedModal";

export default function GlobalBanProvider({
    children,
}: {
    children: React.ReactNode;
}) {

    const [
        banModal,
        setBanModal,
    ] = useState({

        open: false,

        reason: "",

        expiresAt: null as
            string | null,

    });

    // 🔥 Global banned state
    const [
        isBanned,
        setIsBanned,
    ] = useState(false);

    // 🔥 Listen globally
    useEffect(() => {

        const handler =
            (event: any) => {

                setBanModal({

                    open: true,

                    reason:
                        event.detail.reason,

                    expiresAt:
                        event.detail.expiresAt,

                });

                // 🔥 Lock app
                setIsBanned(true);

            };

        window.addEventListener(
            "account-banned",
            handler
        );

        return () => {

            window.removeEventListener(
                "account-banned",
                handler
            );

        };

    }, []);

    // 🔥 Global fetch interceptor
    useEffect(() => {

        const originalFetch =
            window.fetch;

        window.fetch =
            async (
                ...args
            ) => {

                const response =
                    await originalFetch(
                        ...args
                    );

                try {

                    // 🔥 Clone response
                    const cloned =
                        response.clone();

                    const data =
                        await cloned.json();

                    // 🔥 Ban detected
                    if (
                        data.code ===
                        "ACCOUNT_BANNED"
                    ) {

                        window.dispatchEvent(

                            new CustomEvent(

                                "account-banned",

                                {
                                    detail: data,
                                }

                            )

                        );

                    }

                } catch { }

                return response;

            };

        return () => {

            window.fetch =
                originalFetch;

        };

    }, []);

    return (

        <>

            {/* 🔥 Locked app */}
            <div

                style={{

                    pointerEvents:
                        isBanned

                            ? "none"

                            : "auto",

                    userSelect:
                        isBanned

                            ? "none"

                            : "auto",

                    filter:
                        isBanned

                            ? "blur(5px)"

                            : "none",

                    transition:
                        "all 0.3s ease",

                }}

            >

                {children}

            </div>

            {/* 🔥 Global modal */}
            <BannedModal

                open={banModal.open}

                reason={banModal.reason}

                expiresAt={
                    banModal.expiresAt
                }

            />

        </>

    );

}