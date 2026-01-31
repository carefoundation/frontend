'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import dynamic from 'next/dynamic';

const Button = dynamic(() => import('@/components/ui/Button'), { ssr: false });

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Check if user is already logged in and check for registration success
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('registered') === 'true') {
        setSuccessMessage('Registration successful! Your account is pending admin approval. You will be able to login once approved.');
      }
    }
  }, []);

  // NO AUTO-REDIRECT - User must manually login
  // Removed auto-redirect logic to prevent any automatic redirects
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const [{ api }, { setAdminSession }] = await Promise.all([
        import('@/lib/api'),
        import('@/lib/auth')
      ]);
      const response: any = await api.post('/auth/signin', {
        email: formData.email,
        password: formData.password,
      });

      // API returns { success: true, data: { user: {...}, token: "..." } }
      if (response && response.data) {
        const { user, token } = response.data;
        
        // Store user token and data
        if (token) localStorage.setItem('userToken', token);
        if (user) {
          localStorage.setItem('userEmail', user.email);
          localStorage.setItem('userRole', user.role || 'donor');
          localStorage.setItem('userId', user.id || user._id);
          // Store permissions if available
          if (user.permissions) {
            localStorage.setItem('userPermissions', JSON.stringify(user.permissions));
          } else {
            localStorage.setItem('userPermissions', JSON.stringify([]));
          }
        }
        
        // Check if admin or staff
        if (user && user.role === 'admin') {
          setAdminSession();
          // Use replace instead of push for faster navigation
          router.replace('/admin/dashboard');
          setIsLoading(false);
          return;
        }
        if (user && user.role === 'staff') {
          setAdminSession();
          // Use replace instead of push for faster navigation
          router.replace('/staff/dashboard');
          setIsLoading(false);
          return;
        }
        
        setIsLoading(false);
        
        // Check for redirect URL (payment page if coming from donation)
        const redirectUrl = localStorage.getItem('redirectAfterLogin');
        if (redirectUrl) {
          localStorage.removeItem('redirectAfterLogin');
          // Small delay to ensure token is saved
          setTimeout(() => {
            router.push(redirectUrl);
          }, 100);
        } else {
          // If no redirect URL, go to dashboard for regular users
          router.push('/dashboard');
        }
      } else if (response && response.user) {
        // Handle alternative response format
        localStorage.setItem('userToken', response.token || '');
        localStorage.setItem('userEmail', response.user.email);
        localStorage.setItem('userRole', response.user.role || 'donor');
        localStorage.setItem('userId', response.user.id);
        
        if (response.user.role === 'admin') {
          setAdminSession();
          // Use replace instead of push for faster navigation
          router.replace('/admin/dashboard');
          setIsLoading(false);
          return;
        }
        if (response.user.role === 'staff') {
          setAdminSession();
          // Use replace instead of push for faster navigation
          router.replace('/staff/dashboard');
          setIsLoading(false);
          return;
        }
        
        setIsLoading(false);
        const redirectUrl = localStorage.getItem('redirectAfterLogin');
        if (redirectUrl) {
          localStorage.removeItem('redirectAfterLogin');
          // Small delay to ensure token is saved
          setTimeout(() => {
            router.push(redirectUrl);
          }, 100);
        } else {
          // If no redirect URL, go to dashboard for regular users
          router.push('/dashboard');
        }
      }
    } catch (error: any) {
      setIsLoading(false);
      if (error instanceof Error) {
        setError(error.message);
      } else if (error?.message) {
        setError(error.message);
      } else {
        setError('Invalid email or password');
      }
      // Clear success message on error
      setSuccessMessage('');
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ecfdf5] via-white to-[#ecfdf5] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="relative w-24 h-24">
              <Image src="/Logo.png" alt="Logo" fill className="object-contain" />
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Login to continue making a difference</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {successMessage && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                {successMessage}
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-[#10b981] focus:ring-[#10b981]" />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
              <Link href="/forgot-password" className="text-sm text-[#10b981] hover:underline">
                Forgot password?
              </Link>
            </div>
            
            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isLoading}
            >
              Login
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link href="/register" className="text-[#10b981] font-semibold hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-gray-600 hover:text-[#10b981]">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

