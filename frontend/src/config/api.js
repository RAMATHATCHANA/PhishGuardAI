// API Configuration
// In development, use relative URLs which will be proxied by Vite
// In production, use empty string to use same origin
const API_BASE_URL = import.meta.env.PROD ? '' : ''

export const API_URL = API_BASE_URL

export default API_URL

