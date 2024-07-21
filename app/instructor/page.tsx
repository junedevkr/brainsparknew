'use client'

import { useRouter } from 'next/navigation'
import styles from './InstructorPage.module.css'

export default function InstructorPage() {
  const router = useRouter()

  const handleLogin = () => {
    router.push('/auth/login')
  }

  const handleSignup = () => {
    router.push('/auth/signup')
  }

  return (
    <main className={styles.container}>
      <h1 className={styles.title}>브레인스파크와 함께하기</h1>
      
      <section className={styles.recruitmentInfo}>
        <h2>강사 모집 안내</h2>
        <p>브레인스파크에서는 열정적이고 경험 많은 강사님들을 모시고 있습니다.</p>
        <ul>
          <li>다양한 분야의 전문 강사 모집</li>
          <li>유연한 스케줄과 경쟁력 있는 보수</li>
          <li>지속적인 성장 기회 제공</li>
          <li>최신 교육 시설과 자료 지원</li>
        </ul>
        <p>함께 성장하고 발전할 수 있는 기회를 놓치지 마세요!</p>
      </section>

      <div className={styles.actionSection}>
        <div className={styles.signupSection}>
          <p>새로운 강사로 등록하고 싶으신가요?</p>
          <button className={`${styles.button} ${styles.signupButton}`} onClick={handleSignup}>강사 등록</button>
        </div>
        <div className={styles.loginSection}>
          <p>이미 강사로 등록하셨나요? 로그인하여 강의를 시작하세요.</p>
          <button className={`${styles.button} ${styles.loginButton}`} onClick={handleLogin}>강사 로그인</button>
        </div>
      </div>
    </main>
  )
}