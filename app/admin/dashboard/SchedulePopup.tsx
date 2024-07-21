import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import styles from './SchedulePopup.module.css';
import Notification from '../../components/Notification'; // Notification 컴포넌트 import

interface SchedulePopupProps {
  classData: any;
  onClose: () => void;
}

interface ScheduleItem {
  sequence: number;
  schedule_date: string;
  start_period: number;
  end_period: number;
  main_instructor: string[] | null;
  sub_instructor: string[] | null;
  note: string | null;
  class_id: string;
}

const periods = [
  { value: 1, label: '1교시' },
  { value: 2, label: '2교시' },
  { value: 3, label: '3교시' },
  { value: 4, label: '4교시' },
  { value: 5, label: '5교시' },
  { value: 6, label: '6교시' },
  { value: 7, label: '7교시' },
  { value: 8, label: '8교시' },
];

const SchedulePopup: React.FC<SchedulePopupProps> = ({ classData, onClose }) => {
  const [totalDuration, setTotalDuration] = useState(0);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [mainInstructors, setMainInstructors] = useState<any[]>([]);
  const [subInstructors, setSubInstructors] = useState<any[]>([]);
  const [globalMainInstructor, setGlobalMainInstructor] = useState<string>('');
  const [globalSubInstructor, setGlobalSubInstructor] = useState<string>('');
  const [notification, setNotification] = useState<string | null>(null); // 알림 상태 추가
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchSchedules();
    fetchInstructors();
  }, [classData]);

  useEffect(() => {
    updateTotalDuration(schedules);
  }, [schedules]);

  const fetchSchedules = async () => {
    const { data, error } = await supabase
      .from('class_schedule')
      .select('*')
      .eq('class_id', classData.id)
      .order('sequence');
    if (error) console.error('Error fetching schedules:', error);
    else setSchedules(data || []);
  };

  const fetchInstructors = async () => {
    try {
      const mainInstructorIds = classData.instructor_main || [];
      const subInstructorIds = classData.instructor_sub || [];

      const { data: mainData, error: mainError } = await supabase
        .from('instructor_profiles')
        .select('id, name')
        .in('id', mainInstructorIds);
      
      if (mainError) throw mainError;
      setMainInstructors(mainData || []);

      const { data: subData, error: subError } = await supabase
        .from('instructor_profiles')
        .select('id, name')
        .in('id', subInstructorIds);
      
      if (subError) throw subError;
      setSubInstructors(subData || []);
    } catch (error) {
      console.error('Error fetching instructors:', error);
    }
  };

  const handleAddSchedule = async () => {
    const newSequence = schedules.length > 0 ? schedules[schedules.length - 1].sequence + 1 : 1;
    const newSchedule: ScheduleItem = {
      sequence: newSequence,
      schedule_date: new Date().toISOString().split('T')[0],
      start_period: 1,
      end_period: 1,
      main_instructor: [],
      sub_instructor: [],
      note: null,
      class_id: classData.id,
    };

    const { data, error } = await supabase.from('class_schedule').insert([newSchedule]).select();
    if (error) {
      console.error('Error adding new schedule:', error);
      return;
    }

    setSchedules([...schedules, data[0]]);
    updateTotalDuration([...schedules, data[0]]);
  };

  const handleScheduleChange = (index: number, field: keyof ScheduleItem, value: string | number | string[] | null) => {
    const updatedSchedules = [...schedules];
    updatedSchedules[index] = { ...updatedSchedules[index], [field]: value };
    setSchedules(updatedSchedules);
    updateTotalDuration(updatedSchedules);

    const scheduleToUpdate = updatedSchedules[index];
    updateScheduleInDB(scheduleToUpdate);
  };

  const updateScheduleInDB = async (schedule: ScheduleItem) => {
    try {
      const { error } = await supabase
        .from('class_schedule')
        .update({
          sequence: schedule.sequence,
          schedule_date: schedule.schedule_date,
          start_period: schedule.start_period,
          end_period: schedule.end_period,
          main_instructor: schedule.main_instructor,
          sub_instructor: schedule.sub_instructor,
          note: schedule.note,
        })
        .eq('sequence', schedule.sequence)
        .eq('class_id', schedule.class_id);
      if (error) throw error;
    } catch (error) {
      console.error('Error updating schedule:', error);
    }
  };

  const handleCopySchedule = async (index: number) => {
    const scheduleToCopy = schedules[index];
    const newSchedule = {
      ...scheduleToCopy,
      sequence: schedules.length + 1,
      schedule_date: new Date().toISOString().split('T')[0],
    };

    const { data, error } = await supabase.from('class_schedule').insert([newSchedule]).select();
    if (error) {
      console.error('Error copying schedule:', error);
      return;
    }

    setSchedules([...schedules, data[0]]);
    updateTotalDuration([...schedules, data[0]]);

    setTimeout(() => {
      const dateInputs = document.querySelectorAll('input[type="date"]');
      if (dateInputs[dateInputs.length - 1]) {
        (dateInputs[dateInputs.length - 1] as HTMLInputElement).focus();
      }
    }, 0);
  };

  const handleGlobalInstructorChange = (type: 'main' | 'sub', instructorId: string) => {
    if (type === 'main') {
      setGlobalMainInstructor(instructorId);
      const updatedSchedules = schedules.map(schedule => ({
        ...schedule,
        main_instructor: [instructorId]
      }));
      setSchedules(updatedSchedules);
      updatedSchedules.forEach(schedule => updateScheduleInDB(schedule));
    } else {
      setGlobalSubInstructor(instructorId);
      const updatedSchedules = schedules.map(schedule => ({
        ...schedule,
        sub_instructor: [instructorId]
      }));
      setSchedules(updatedSchedules);
      updatedSchedules.forEach(schedule => updateScheduleInDB(schedule));
    }
  };

  const calculateDuration = (start: number, end: number) => {
    return end >= start ? end - start + 1 : 0;
  };

  const updateTotalDuration = (updatedSchedules: ScheduleItem[]) => {
    const total = updatedSchedules.reduce((sum, schedule) => {
      return sum + calculateDuration(schedule.start_period, schedule.end_period);
    }, 0);
    setTotalDuration(total);
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase.from('class_schedule').upsert(
        schedules.map(schedule => ({
          sequence: schedule.sequence,
          schedule_date: schedule.schedule_date,
          start_period: schedule.start_period,
          end_period: schedule.end_period,
          main_instructor: schedule.main_instructor,
          sub_instructor: schedule.sub_instructor,
          note: schedule.note,
          class_id: schedule.class_id,
        }))
      );
      if (error) throw error;

      onClose();
      setNotification('저장되었습니다.'); // 저장 메시지 설정
    } catch (error) {
      console.error('Error saving schedules:', error);
    }
  };

  const handleDeleteSchedule = async (index: number) => {
    const scheduleToDelete = schedules[index];
    if (scheduleToDelete.sequence && scheduleToDelete.class_id) {
      const { error } = await supabase
        .from('class_schedule')
        .delete()
        .eq('sequence', scheduleToDelete.sequence)
        .eq('class_id', scheduleToDelete.class_id);

      if (error) {
        console.error('Error deleting schedule:', error);
        return;
      }
    }
    const updatedSchedules = schedules.filter((_, i) => i !== index);
    setSchedules(updatedSchedules);
    updateTotalDuration(updatedSchedules);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.popup}>
        <h2>수업 일정 관리</h2>
        <div className={styles.totalDuration}>전체 수업시간: {totalDuration}시간</div>
        {schedules.length === 0 ? (
          <div className={styles.noScheduleMessage}>일정이 등록되지 않았습니다</div>
        ) : (
          <div className={styles.scheduleTable}>
            <div className={styles.headerRow}>
              <span>순번</span>
              <span>날짜</span>
              <span>시작</span>
              <span>종료</span>
              <span>시간</span>
              <span>
                주강사
                <select
                  value={globalMainInstructor}
                  onChange={(e) => handleGlobalInstructorChange('main', e.target.value)}
                >
                  <option value="">전체 선택</option>
                  {mainInstructors.map(instructor => (
                    <option key={instructor.id} value={instructor.id}>{instructor.name}</option>
                  ))}
                </select>
              </span>
              <span>
                보조강사
                <select
                  value={globalSubInstructor}
                  onChange={(e) => handleGlobalInstructorChange('sub', e.target.value)}
                >
                  <option value="">전체 선택</option>
                  {subInstructors.map(instructor => (
                    <option key={instructor.id} value={instructor.id}>{instructor.name}</option>
                  ))}
                </select>
              </span>
              <span>비고</span>
              <span>작업</span>
            </div>
            {schedules.map((schedule, index) => (
              <div key={index} className={styles.scheduleItem}>
                <span>{schedule.sequence}</span>
                <input
                  type="date"
                  value={schedule.schedule_date || ''}
                  onChange={(e) => handleScheduleChange(index, 'schedule_date', e.target.value)}
                />
                <select
                  value={schedule.start_period}
                  onChange={(e) => handleScheduleChange(index, 'start_period', parseInt(e.target.value))}
                >
                  {periods.map(period => (
                    <option key={period.value} value={period.value}>{period.label}</option>
                  ))}
                </select>
                <select
                  value={schedule.end_period}
                  onChange={(e) => handleScheduleChange(index, 'end_period', parseInt(e.target.value))}
                >
                  {periods.map(period => (
                    <option key={period.value} value={period.value}>{period.label}</option>
                  ))}
                </select>
                <span>{calculateDuration(schedule.start_period, schedule.end_period)}시간</span>
                <select
                  value={schedule.main_instructor ? schedule.main_instructor[0] || '' : ''} // null 확인
                  onChange={(e) => handleScheduleChange(index, 'main_instructor', [e.target.value])}
                >
                  <option value="">선택</option>
                  {mainInstructors.map(instructor => (
                    <option key={instructor.id} value={instructor.id}>{instructor.name}</option>
                  ))}
                </select>
                <select
                  value={schedule.sub_instructor ? schedule.sub_instructor[0] || '' : ''} // null 확인
                  onChange={(e) => handleScheduleChange(index, 'sub_instructor', [e.target.value])}
                >
                  <option value="">선택</option>
                  {subInstructors.map(instructor => (
                    <option key={instructor.id} value={instructor.id}>{instructor.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={schedule.note || ''}
                  onChange={(e) => handleScheduleChange(index, 'note', e.target.value)}
                  placeholder="비고"
                />
                <div className={styles.actionButtons}>
                  <button onClick={() => handleCopySchedule(index)}>복사</button>
                  <button onClick={() => handleDeleteSchedule(index)} className={styles.deleteButton}>삭제</button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className={styles.bottomButtons}>
          <button onClick={handleAddSchedule}>+ 일정 추가</button>
          <button onClick={handleSave}>저장</button>
          <button onClick={onClose}>닫기</button>
        </div>
      </div>
      {notification && <Notification message={notification} />} {/* 알림 표시 */}
    </div>
  );
};

export default SchedulePopup;
