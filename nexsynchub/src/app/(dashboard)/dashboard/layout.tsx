import DashboardNavbar
from "@/components/layout/DashboardNavbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (

    <div
      className="
      min-h-screen
      bg-gradient-to-br
      from-gray-950
      via-gray-900
      to-gray-950
      "
    >

      <DashboardNavbar />

      <main>
        {children}
      </main>

    </div>

  );

}