import PublicNavbar from "@/components/PublicNavbar";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      <PublicNavbar />

      <main>
        {children}
      </main>
    </div>
  );
}