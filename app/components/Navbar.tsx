// Navbar.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import styles from './Navbar.module.css';
import TextLogo from './TextLogo';
import ImageLogo from './ImageLogo';
import { useAuth } from '../auth/AuthContext';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [userDisplayName, setUserDisplayName] = useState('');
  const [userRole, setUserRole] = useState('');
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { user, logout } = useAuth();

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const { data: profileData, error: profileError } = await supabase
          .from('instructor_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
        } else {
          setUserDisplayName(profileData?.name || user.email);
          setUserRole(profileData?.role || '');
        }
      }
    };

    fetchUserData();
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/programs', label: '프로그램' },
    { href: '/inquiry', label: '수업문의' },
    { href: '/instructor', label: '강사전용' },
  ];

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <div className={styles.navbarContent}>
          <Link href="/" className={styles.logo}>
            <ImageLogo color="#FFFFFF" width={38} />
            <TextLogo color="#FFFFFF" width={150} />
          </Link>
          <div className={styles.rightContent}>
            <div className={`${styles.menuContainer} ${isOpen ? styles.open : ''}`}>
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className={styles.navLink} onClick={() => setIsOpen(false)}>
                  {item.label}
                </Link>
              ))}
              {user && (
                <span className={styles.userName}>
                  {userRole === 'superadmin' ? 'Super Admin' : userRole === 'staff' ? 'Admin' : userDisplayName}
                </span>
              )}
            </div>
            {user ? (
              <button onClick={handleLogout} className={styles.logoutButton}>
                Logout
              </button>
            ) : (
              <Link href="/auth/login" className={styles.loginButton}>
                Login
              </Link>
            )}
          </div>
          <button className={styles.mobileMenuBtn} onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? 'Close' : 'Menu'}
          </button>
        </div>
      </div>
    </nav>
  );
}
