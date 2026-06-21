import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support Center",
  description: "Get assistance from the NexSyncHub support team. Submit support requests, report bugs, ask billing questions, or suggest new features.",
  alternates: {
    canonical: "https://nexsynchub.com/support-center",
  },
};

export default function SupportCenterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
