import { redirect } from "next/navigation";

/**
 * The middleware already requires a session to reach this route, so anyone who
 * gets here is signed in and belongs on the dashboard. The old first-run
 * branch (no users yet -> /signup) is gone: accounts are created on the central
 * Toka auth app, and the local `User` row is provisioned on first request.
 */
export default async function RootPage() {
  redirect("/dashboard");
}
