import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import styles from './Dashboard.module.css'
import ClassApplicationPage from '../class-application/page'
import ClassSchedulePage from '../class-schedule/page'
import InstructorProfilePage from '../profile/[id]/page'

export default async function Dashboard() {
  const supabase = createServerComponentClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // Handle case when user is not logged in
    return <div>강사로 로그인 해주세요.</div>
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>강사 대시보드</h1>
      <div className={styles.content}>
        <h2>수업 신청</h2>
        <ClassApplicationPage />
        
        <h2>나의 수업 일정</h2>
        <ClassSchedulePage/>
        
        <h2>나의 프로필 관리</h2>
        <InstructorProfilePage params={{ id: user.id }} />
      </div>
    </div>
  )
}
