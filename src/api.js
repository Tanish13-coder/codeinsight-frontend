const API = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'http://localhost:8080');
export default API;