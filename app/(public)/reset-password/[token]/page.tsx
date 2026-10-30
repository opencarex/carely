import { redirect } from "next/navigation";

export default async function ResetPasswordTokenRedirectPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  redirect(`/reset-password?token=${encodeURIComponent(token)}`);
}
