import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/auth";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if user is already authenticated
  const user = await getCurrentUser();

  // Redirect to dashboard if logged in
  if (user) {
    redirect("/dashboard/jobs");
  }

  return <>{children}</>;
}
