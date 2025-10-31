import { requireAuth } from "@/lib/auth0";
import { DashboardClient } from "./_components/DashboardClient";

export default async function DashboardPage() {
  // Protect this page - redirect to login if not authenticated
  await requireAuth();

  return <DashboardClient />;
}
