import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import styles from './ClassApplication.module.css'

interface Class {
  id: string;
  class_details: string;
  equipment_and_materials: string;
  confirmed_instructor1_fee: number;
  confirmed_instructor2_fee: number;
  additional_info: string;
  inquiry_id: string;
  apply_main: string[];
  apply_sub: string[];
  instructor_main: string[];
  instructor_sub: string[];
}

interface Inquiry {
  id: string;
  location: string;
  institution: string;
  status?: string;
}

interface Schedule {
  id: string;
  class_id: string;
  schedule_date: string;
  start_period: number;
  end_period: number;
}

export default async function ClassApplicationPage() {
  const supabase = createServerComponentClient({ cookies })

  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id

  const { data: classes = [] } = await supabase
    .from('classes')
    .select('*')
    .eq('class_open_status', '모집중')

  const { data: inquiries = [] } = await supabase
    .from('inquiries')
    .select('id, location, institution')

  const { data: schedules = [] } = await supabase
    .from('class_schedule')
    .select('*')

  const groupedClasses = (classes as Class[]).reduce((acc, classItem) => {
    const inquiry = (inquiries as Inquiry[]).find(i => i.id === classItem.inquiry_id);
    const institution = inquiry?.institution || 'Unknown';

    if (!acc[institution]) {
      acc[institution] = [];
    }
    acc[institution].push(classItem);
    return acc;
  }, {} as Record<string, Class[]>);

  const getFormattedDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('ko-KR', options);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>출강 신청</h1>
      {Object.keys(groupedClasses).length === 0 ? (
        <div>신청할 수업이 없습니다.</div>
      ) : (
        Object.keys(groupedClasses).map(institution => (
          <div key={institution} className={styles.institutionSection}>
            <div className={styles.cardsContainer}>
              {groupedClasses[institution].map((classItem: Class) => {
                const inquiry = (inquiries as Inquiry[]).find(i => i.id === classItem.inquiry_id);
                const classSchedules = (schedules as Schedule[]).filter(s => s.class_id === classItem.id);

                return (
                  <div key={classItem.id} className={styles.card}>
                    <h2 className={styles.institutionName}>{institution}</h2>
                    <div className={styles.cardContent}>
                      <div className={styles.leftColumn}>
                        <p><strong>위치:</strong> {inquiry?.location}</p>
                        <p><strong>기관:</strong> {inquiry?.institution}</p>
                        <p><strong>수업 상세:</strong> {classItem.class_details}</p>
                        <p><strong>장비 및 재료:</strong> {classItem.equipment_and_materials}</p>
                        {classItem.instructor_main?.includes(userId || '') && (
                          <p><strong>주강사 비용:</strong> {classItem.confirmed_instructor1_fee}</p>
                        )}
                        {classItem.instructor_sub?.includes(userId || '') && (
                          <p><strong>보조강사 비용:</strong> {classItem.confirmed_instructor2_fee}</p>
                        )}
                        <p><strong>추가 정보:</strong> {classItem.additional_info}</p>
                      </div>
                      <div className={styles.rightColumn}>
                        <h3>수업 일정 및 시간</h3>
                        <table className={styles.innerScheduleTable}>
                          <thead>
                            <tr>
                              <th>날짜</th>
                              <th>교시</th>
                            </tr>
                          </thead>
                          <tbody>
                            {classSchedules.map(schedule => (
                              <tr key={schedule.id}>
                                <td>{getFormattedDate(schedule.schedule_date)}</td>
                                <td>{`${schedule.start_period} - ${schedule.end_period} 교시`}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div className={styles.applicationButtons}>
                      <button
                        className={classItem.apply_main?.includes(userId || '') ? styles.appliedButton : styles.applyButton}
                      >
                        {classItem.apply_main?.includes(userId || '') ? '주강사 신청됨' : '주강사 신청'}
                      </button>
                      <button
                        className={classItem.apply_sub?.includes(userId || '') ? styles.appliedButton : styles.applyButton}
                      >
                        {classItem.apply_sub?.includes(userId || '') ? '보조강사 신청됨' : '보조강사 신청'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}