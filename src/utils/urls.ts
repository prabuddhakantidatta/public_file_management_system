/**
 * Generate a proper hash-based URL for QR codes.
 * Since we use HashRouter, all routes are prefixed with /#/
 * This ensures QR codes work on any hosting without server-side rewrites.
 */
export function getAppUrl(path: string): string {
  const base = window.location.origin + window.location.pathname;
  // Remove trailing slash if present
  const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
  return `${cleanBase}/#${path}`;
}

export function getFileUrl(fileId: string): string {
  return getAppUrl(`/file/${fileId}`);
}

export function getCabinetUrl(cabinetId: string): string {
  return getAppUrl(`/cabinet/${cabinetId}`);
}
