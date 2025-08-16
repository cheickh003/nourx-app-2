
import { AuthGuard } from "@/components/auth/auth-guard";
import { AdminLayout } from "@/components/layout/admin/admin-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard role="admin">
      <AdminLayout>{children}</AdminLayout>
    </AuthGuard>
  );
}
