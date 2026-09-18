/**
 * ADMIN MODE CONFIGURATION (BACKEND / DEVELOPER CONTROL)
 * =======================================================
 * To activate Admin Mode & data editing controls:
 * Set ENABLE_ADMIN_MODE = true below.
 *
 * When ENABLE_ADMIN_MODE is false (default):
 * - All admin buttons ("Admin & Data Control", "Upload Project", "Change Photo", etc.) are completely hidden from public visitors.
 * - Visitors only see your live portfolio and projects fetched in real-time from Supabase / durable database.
 * - No viewer or unauthorized person can manipulate or edit your portfolio.
 *
 * When you (the owner/developer) want to manage your data:
 * - Set ENABLE_ADMIN_MODE = true, and your Admin Dashboard & editing tools will be accessible.
 */
export const ENABLE_ADMIN_MODE = true;
