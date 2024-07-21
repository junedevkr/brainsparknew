'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import styles from './Dashboard.module.css'

const InquiriesPage = dynamic(() => import('./InquiriesPage'), { ssr: false })
const ClassesPage = dynamic(() => import('./ClassesPage'), { ssr: false })
const ResultsPage = dynamic(() => import('../payment-calculation/page'), { ssr: false })
const InstructorsPage = dynamic(() => import('./InstructorsPage'), { ssr: false })
const AllSchedulesPage = dynamic(() => import('./AllSchedulesPage'), { ssr: false })

export default function AdminDashboard() {
  const [activePage, setActivePage] = useState('inquiries')

  const renderActivePage = () => {
    switch (activePage) {
      case 'classes':
        return <ClassesPage />
      case 'results':
        return <ResultsPage />
      case 'instructors':
        return <InstructorsPage />
      case 'inquiries':
        return <InquiriesPage />
      case 'AllSchedules':
          default:
            return <AllSchedulesPage />
    
    }
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>관리자 대시보드</h1>
      <div className={styles.nav}>
        <a className={activePage === 'allSchedules' ? styles.active : ''} onClick={() => setActivePage('allSchedules')}>
            모든 수업
          </a>
        <a className={activePage === 'inquiries' ? styles.active : ''} onClick={() => setActivePage('inquiries')}>
          수업 문의 및 견적 요청
        </a>
        <a className={activePage === 'classes' ? styles.active : ''} onClick={() => setActivePage('classes')}>
          수업 관리 및 강사 배정
        </a>
        <a className={activePage === 'PaymentCalculationPage' ? styles.active : ''} onClick={() => setActivePage('results')}>
          수업 정산 및 결과
        </a>
        <a className={activePage === 'instructors' ? styles.active : ''} onClick={() => setActivePage('instructors')}>
          강사 관리
        </a>
      </div>
      {renderActivePage()}
    </div>
  )
}

