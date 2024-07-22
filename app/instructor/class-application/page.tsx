'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import styles from './ClassApplication.module.css';

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

const ClassApplicationPage = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
    }

    const { data: classesData } = await supabase
      .from('classes')
      .select('*')
      .eq('class_open_status', '모집중');

    const { data: inquiriesData } = await supabase
      .from('inquiries')
      .select('id, location, institution');

    const { data: schedulesData } = await supabase
      .from('class_schedule')
      .select('*');

    setClasses(classesData || []);
    setInquiries(inquiriesData || []);
    setSchedules(schedulesData || []);
  };

  const handleApply = async (classId: string, type: 'main' | 'sub') => {
    if (!userId) return;

    const classToUpdate = classes.find(c => c.id === classId);
    if (!classToUpdate) return;

    const column = type === 'main' ? 'apply_main' : 'apply_sub';
    const currentApplicants = classToUpdate[column] || [];

    if (currentApplicants.includes(userId)) {
      // 이미 신청한 경우, 취소 확인
      if (confirm('신청을 취소하시겠습니까?')) {
        const updatedApplicants = currentApplicants.filter(id => id !== userId);
        await updateClassApplicants(classId, column, updatedApplicants);
      }
    } else {
      // 신규 신청
      const updatedApplicants = [...currentApplicants, userId];
      await updateClassApplicants(classId, column, updatedApplicants);
    }
  };

  const updateClassApplicants = async (classId: string, column: string, applicants: string[]) => {
    const { error } = await supabase
      .from('classes')
      .update({ [column]: applicants })
      .eq('id', classId);

    if (error) {
      console.error('Error updating applicants:', error);
    } else {
      fetchData();
    }
  };

  const groupedClasses = classes.reduce((acc, classItem) => {
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
                const inquiry = inquiries.find(i => i.id === classItem.inquiry_id);
                const classSchedules = schedules.filter(s => s.class_id === classItem.id);

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
                        onClick={() => handleApply(classItem.id, 'main')}
                        className={classItem.apply_main?.includes(userId || '') ? styles.appliedButton : styles.applyButton}
                      >
                        {classItem.apply_main?.includes(userId || '') ? '주강사 신청됨' : '주강사 신청'}
                      </button>
                      <button
                        onClick={() => handleApply(classItem.id, 'sub')}
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
};

export default ClassApplicationPage;
