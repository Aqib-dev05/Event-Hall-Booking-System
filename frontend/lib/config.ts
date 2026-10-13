// Base URL of the Express backend (including /api). Safe to import from client and server code.
export const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/$/, '')
