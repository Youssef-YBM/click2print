'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (!storedUser || !storedToken) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(storedUser));
    setToken(storedToken);
  }, []);

  const logout = () => {
    localStorage.clear();
    router.push('/login');
  };

  const isAdmin = user?.role === 'admin';
  const isOperator = user?.role === 'operator';
  const isClient = user?.role === 'client';

  return { user, token, logout, isAdmin, isOperator, isClient };
}