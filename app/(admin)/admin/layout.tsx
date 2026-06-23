import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Guard: Redirect if not authenticated or not an ADMIN role user
  if (!session || session.user.role !== "ADMIN") {
    redirect("/account");
  }

  return (
    <div className="min-h-screen bg-[var(--obsidian)] text-[var(--white)] flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <AdminSidebar session={session} />

      {/* Main dashboard content */}
      <main className="flex-grow p-6 md:p-10">
        {children}
      </main>
    </div>
  );
}
