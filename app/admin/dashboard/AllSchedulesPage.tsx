import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import styles from './AllSchedulesPage.module.css';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import Modal, { Styles as ReactModalStyles } from 'react-modal';
import dynamic from 'next/dynamic';

import './fullcalendar-custom.css';

// Add type definition for react-modal
declare module 'react-modal';


const periods = [
  '1교시', '2교시', '3교시', '4교시',
  '5교시', '6교시', '7교시', '8교시'
];

const customStyles: ReactModalStyles = {
  content: {
    top: '10%',
    left: '50%',
    transform: 'translate(-50%, 0)',
    background: 'white',
    padding: '20px',
    borderRadius: '10px',
    width: '80%',
    maxHeight: '80vh',
    overflowY: 'auto',
    zIndex: '1001',
    display: 'flex',
    flexDirection: 'column',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    zIndex: '1000'
  }
};

const ClassDetailsModal = dynamic(() => import('./ClassDetailsModal'), { ssr: false });

interface Schedule {
  schedule_date: string;
  start_period: number;
  end_period: number;
  class_id: string;
  main_instructor: string[];
  sub_instructor: string[];
  note: string;
  classes: {
    inquiry_id: string;
  };
  institution: string;
}

export default function AllSchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [view, setView] = useState<'list' | 'calendar'>('calendar');
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchSchedules();
  }, [selectedDate]);

  const fetchSchedules = async () => {
    let query = supabase
      .from('class_schedule')
      .select('schedule_date, start_period, end_period, class_id, main_instructor, sub_instructor, note, classes (inquiry_id)')
      .order('schedule_date', { ascending: true });

    if (selectedDate) {
      query = query.eq('schedule_date', selectedDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching schedules:', error);
    } else {
      const schedulesWithInstitution = await Promise.all(data.map(async (schedule: any) => {
        const { data: inquiriesData, error: inquiriesError } = await supabase
          .from('inquiries')
          .select('institution')
          .eq('id', schedule.classes.inquiry_id)
          .single();

        if (inquiriesError) {
          console.error('Error fetching inquiries data:', inquiriesError);
          return { ...schedule, institution: 'Unknown' };
        }

        return { ...schedule, institution: inquiriesData.institution };
      }));

      console.log('Fetched schedules:', schedulesWithInstitution); // Debugging log
      setSchedules(schedulesWithInstitution || []);
    }
  };

  const groupSchedulesByDateAndInstitution = (schedules: any[]) => {
    return schedules.reduce((groups, schedule) => {
      const date = schedule.schedule_date;
      const institution = schedule.institution;
      if (!groups[date]) {
        groups[date] = {};
      }
      if (!groups[date][institution]) {
        groups[date][institution] = [];
      }
      groups[date][institution].push(schedule);
      return groups;
    }, {} as Record<string, Record<string, Schedule[]>>);
  };

  const calculateTotalHours = (schedules: any[]) => {
    return schedules.reduce((total, schedule) => {
      return total + (schedule.end_period - schedule.start_period + 1);
    }, 0);
  };

  const renderListView = () => {
    const groupedSchedules = groupSchedulesByDateAndInstitution(schedules);

    return (
      <div>
        {Object.keys(groupedSchedules).length === 0 ? (
          <div className={styles.noScheduleMessage}>일정이 등록되지 않았습니다</div>
        ) : (
          Object.keys(groupedSchedules).map((date) => (
            <div key={date} className={styles.scheduleGroup}>
              <h2>{date}</h2>
              {Object.keys(groupedSchedules[date]).map((institution) => (
                <div key={institution} className={styles.classGroup}>
                  <h3>{institution}</h3>
                  <table className={styles.scheduleTable}>
                    <thead>
                      <tr>
                        <th>교시</th>
                        <th>주강사</th>
                        <th>보조강사</th>
                        <th>비고</th>
                      </tr>
                    </thead>
                    <tbody>
                    {groupedSchedules[date][institution].map((schedule: Schedule, index: number) => (                        <tr key={`${schedule.class_id}-${index}`}>
                          <td>{periods[schedule.start_period - 1]} - {periods[schedule.end_period - 1]}</td>
                          <td>{schedule.main_instructor?.join(', ') || ''}</td>
                          <td>{schedule.sub_instructor?.join(', ') || ''}</td>
                          <td>{schedule.note || ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    );
  };

  const renderCalendarView = () => {
    const groupedSchedules = groupSchedulesByDateAndInstitution(schedules);

    return (
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        events={Object.keys(groupedSchedules).flatMap(date => {
          return Object.keys(groupedSchedules[date]).map(institution => {
            const totalHours = calculateTotalHours(groupedSchedules[date][institution]);
            return {
              title: `${institution} (${totalHours}시간)`,
              start: date,
              end: date,
              extendedProps: {
                classId: groupedSchedules[date][institution][0].class_id,
                schedules: groupedSchedules[date][institution]
              }
            };
          });
        })}
        eventContent={(eventInfo) => (
          <div>
            <b>{eventInfo.timeText}</b>
            <i>{eventInfo.event.title}</i>
          </div>
        )}
        eventClick={(info) => {
          openModal(info.event.extendedProps.classId);
        }}
      />
    );
  };

  const openModal = (classId: string) => {
    setSelectedClassId(classId);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setSelectedClassId(null);
  };

  return (
    <div className={styles.container}>
      <h1>전체 수업 일정</h1>
      <div className={styles.viewToggle}>
        <button onClick={() => setView('list')}>목록 보기</button>
        <button onClick={() => setView('calendar')}>달력 보기</button>
      </div>
      <input
        type="date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
      />
      {view === 'list' ? renderListView() : renderCalendarView()}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        style={customStyles}
        contentLabel="Class Details Modal"
      >
        <ClassDetailsModal classId={selectedClassId} onClose={closeModal} />
      </Modal>
    </div>
  );
}
