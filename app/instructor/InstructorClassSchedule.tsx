import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Schedule {
  id: string;
  location: string;
  institution: string;
  firstClassDate: string;
  lastClassDate: string;
  totalHours: number;
}

interface Props {
  userId: string;
}

const InstructorClassSchedule: React.FC<Props> = ({ userId }) => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (userId) {
      fetchSchedules();
    }
  }, [userId]);

  const fetchSchedules = async () => {
    try {
      // Replace this with your actual API call
      const { data, error } = await supabase
        .from('instructor_schedules')
        .select('*')
        .eq('instructor_id', userId);

      if (error) throw error;

      setSchedules(data || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    }
  };

  return (
    <div>
      <h2>출강한 수업 목록</h2>
      <table>
        <thead>
          <tr>
            <th>지역</th>
            <th>학교 이름</th>
            <th>최초 수업일</th>
            <th>마지막 일정</th>
            <th>참여한 수업 시간수</th>
          </tr>
        </thead>
        <tbody>
          {schedules.map(schedule => (
            <tr key={schedule.id}>
              <td>{schedule.location}</td>
              <td>{schedule.institution}</td>
              <td>{schedule.firstClassDate}</td>
              <td>{schedule.lastClassDate}</td>
              <td>{schedule.totalHours}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InstructorClassSchedule;