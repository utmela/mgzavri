export function safeReturnTo(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\x00-\x20]/.test(value)) return "/";
  try {
    const decoded = decodeURIComponent(value);
    if (decoded.startsWith("//") || /[\\\x00-\x20]/.test(decoded)) return "/";
    const url = new URL(value, "https://mgzavri.invalid");
    if (url.origin !== "https://mgzavri.invalid" || url.pathname.startsWith("/auth")) return "/";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch { return "/"; }
}
