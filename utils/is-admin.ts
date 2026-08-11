function adminEmails(): string[] {
  return (process.env.VAIDYA_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined) {
  if (!email) return false;
  return adminEmails().includes(email.toLowerCase());
}
