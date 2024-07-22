'use client';

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import styles from './Dashboard.module.css';
import ClassApplicationPage from '../class-application/page';
import ClassSchedulePage from '../class-schedule/page';
import InstructorProfilePage from '../profile/[id]/page';

export default function InstructorDashboardPage() {
  const [activeTab, setActiveTab] = useState<'application' | 'schedule' | 'profile'>('application');
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    fetchUserId();
  }, []);

  const fetchUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
    } else {
      // If no user is found, redirect to login page
      router.push('/login');
    }
  };

  const renderContent = () => {
    if (!userId) return null;

    if (activeTab === 'application') {
      return <ClassApplicationPage />;
    } else if (activeTab === 'schedule') {
      return <ClassSchedulePage />;
    } else if (activeTab === 'profile') {
      return <InstructorProfilePage params={{ id: userId }} />;
    }
  };



  return (
    <div className={styles.container}>
      <h1 className={styles.title}>강사 대시보드</h1>
      <div className={styles.tabContainer}>
        <button
          className={activeTab === 'application' ? styles.activeTab : ''}
          onClick={() => setActiveTab('application')}
        >
          수업 신청
        </button>
        <button
          className={activeTab === 'schedule' ? styles.activeTab : ''}
          onClick={() => setActiveTab('schedule')}
        >
          나의 수업 일정
        </button>
        <button
          className={activeTab === 'profile' ? styles.activeTab : ''}
          onClick={() => setActiveTab('profile')}
        >
          나의 프로필 관리
        </button>
      </div>
      <div className={styles.content}>
        {renderContent()}
      </div>
    </div>
  );
}
