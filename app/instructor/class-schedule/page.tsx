'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import styles from './ClassSchedule.module.css';

interface Class {
  id: string;
  class_details: string;
  equipment_and_materials: string;
  confirmed_instructor1_fee: number;
  confirmed_instructor2_fee: number;
  additional_info: string;
  inquiry_id: string;
  instructor_main: string[];
  instructor_sub: string[];
}

interface Inquiry {
  id: string;
  location: string;
  institution: string;
  status: string;
}

interface Schedule {
  id: string;
  class_id: string;
  schedule_date: string;
  start_period: number;
  end_period: number;
  main_instructor: string[];
  sub_instructor: string[];
}

const ClassSchedulePage = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      } else {
        setLoading(false);
        return;
      }

      const [classesResponse, inquiriesResponse, schedulesResponse] = await Promise.all([
        supabase.from('classes').select('*').or(`instructor_main.cs.{${user.id}},instructor_sub.cs.{${user.id}}`),
        supabase.from('inquiries').select('*').eq('status', '확정'),
        supabase.from('class_schedule').select('*').or(`main_instructor.cs.{${user.id}},sub_instructor.cs.{${user.id}}`)
      ]);

      setClasses(classesResponse.data || []);
      setInquiries(inquiriesResponse.data || []);
      setSchedules(schedulesResponse.data || []);
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return <div>로딩 중...</div>;
  }

  if (!userId) {
    return <div>로그인이 필요합니다.</div>;
  }

  const filterClasses = classes.filter(
    classItem =>
      (classItem.instructor_main?.includes(userId) || classItem.instructor_sub?.includes(userId)) &&
      inquiries.some(inquiry => inquiry.id === classItem.inquiry_id)
  );

  const filterSchedules = schedules.filter(
    schedule => filterClasses.some(classItem => classItem.id === schedule.class_id)
  );

  const groupedClasses = filterClasses.reduce((acc, classItem) => {
    const inquiry = inquiries.find(i => i.id === classItem.inquiry_id);
    const institution = inquiry?.institution || 'Unknown';

    if (!acc[institution]) {
      acc[institution] = [];
    }
    acc[institution].push(classItem);
    return acc;
  }, {} as Record<string, Class[]>);

  const getFormattedDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' };
    return date.toLocaleDateString('ko-KR', options);
  };

  const calculateTotalHours = (classId: string) => {
    const classSchedules = filterSchedules.filter(s => s.class_id === classId);
    return classSchedules.reduce((total, schedule) => total + (schedule.end_period - schedule.start_period + 1), 0);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>나의 수업 일정</h1>
      {Object.keys(groupedClasses).length === 0 ? (
        <div>편성된 수업 일정이 없습니다.</div>
      ) : (
        Object.entries(groupedClasses).map(([institution, classes]) => (
          <div key={institution} className={styles.institutionSection}>
            <div className={styles.cardsContainer}>
              {classes.map(classItem => {
                const inquiry = inquiries.find(i => i.id === classItem.inquiry_id);
                const classSchedules = filterSchedules.filter(s => s.class_id === classItem.id);

                return (
                  <div key={classItem.id} className={styles.card}>
                    <h2 className={styles.institutionName}>{institution}</h2>
                    <div className={styles.cardContent}>
                      <div className={styles.leftColumn}>
                        <p><strong>위치:</strong> {inquiry?.location}</p>
                        <p><strong>기관:</strong> {inquiry?.institution}</p>
                        <p><strong>수업 상세:</strong> {classItem.class_details}</p>
                        <p><strong>장비 및 재료:</strong> {classItem.equipment_and_materials}</p>
                        {classItem.instructor_main?.includes(userId) && (
                          <p><strong>주강사 비용:</strong> {classItem.confirmed_instructor1_fee}</p>
                        )}
                        {classItem.instructor_sub?.includes(userId) && (
                          <p><strong>보조강사 비용:</strong> {classItem.confirmed_instructor2_fee}</p>
                        )}
                        <p><strong>추가 정보:</strong> {classItem.additional_info}</p>
                        <p><strong>전체 수업 시수:</strong> {calculateTotalHours(classItem.id)}시간</p>
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
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ClassSchedulePage;
