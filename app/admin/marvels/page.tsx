import { cookies } from "next/headers";
import AdminAccessGate from "./AdminAccessGate";
import AdminMarvelsForm from "./AdminMarvelsForm";

export default async function AdminMarvelsPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("admin_access_token")?.value;
  const adminToken = process.env.ADMIN_TOKEN;
  const publicAdminToken = process.env.NEXT_PUBLIC_ADMIN_TOKEN;

  const isAuthorized = Boolean(
    accessToken &&
      adminToken &&
      publicAdminToken &&
      accessToken === adminToken &&
      accessToken === publicAdminToken
  );

  if (!isAuthorized) {
    return <AdminAccessGate />;
  }

  return <AdminMarvelsForm />;
}
