'use client'

import React, { ReactNode } from 'react';
import { useRouter } from 'next/router'
import styles from './DashboardLayout.module.css'

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const router = useRouter();

  return (
    <div className={styles.dashboard}>
      <nav className={styles.navbar}>
        <ul className={styles.navList}>
          <li className={styles.navItem} onClick={() => router.push('/admin/inquiries')}>
            수업 문의 및 견적 요청
          </li>
          <li className={styles.navItem} onClick={() => router.push('/admin/classes')}>
            수업 관리 및 강사 배정
          </li>
          <li className={styles.navItem} onClick={() => router.push('/admin/settlement')}>
            수업 정산 및 결과
          </li>
          <li className={styles.navItem} onClick={() => router.push('/admin/instructors')}>
            강사 관리
          </li>
        </ul>
      </nav>
      <div className={styles.content}>
        {children}
      </div>
    </div>
  )
}

export default DashboardLayout;
