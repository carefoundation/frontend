// Admin credentials
export const ADMIN_CREDENTIALS = {
  email: 'adminaziz@care.com',
  password: '@Karbala78652',
};

// Check if user is admin
export function isAdmin(email: string, password: string): boolean {
  return email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password;
}

// Store admin session
export function setAdminSession() {
  if (typeof window !== 'undefined') {
    localStorage.setItem('adminToken', 'admin-authenticated');
    localStorage.setItem('adminEmail', ADMIN_CREDENTIALS.email);
  }
}

// Check admin session
export function checkAdminSession(): boolean {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('adminToken') === 'admin-authenticated';
  }
  return false;
}

// Clear admin session
export function clearAdminSession() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminEmail');
  }
}

// Get admin email
export function getAdminEmail(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('adminEmail');
  }
  return null;
}

