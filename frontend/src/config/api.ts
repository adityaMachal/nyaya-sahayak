/**
 * Application API Configuration
 *
 * Centralizes the backend API base URL across the application.
 * In development, defaults to http://localhost:8000.
 * In Docker / staging / production, reads from NEXT_PUBLIC_API_URL.
 */
export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
).replace(/\/$/, "");
