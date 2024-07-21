// ./app/admin/payment-calculation/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import styles from './PaymentCalculation.module.css'
import { FaCopy } from 'react-icons/fa'

interface Instructor {
  id: string;
  name: string;
  account_number: string;
}

interface ClassSchedule {
  class_id: string;
  schedule_date: string;
  start_period: number;
  end_period: number;
  main_instructor: string[];
  sub_instructor: string[];
}

interface Class {
  id: string;
  inquiry_id: string;
  confirmed_instructor1_fee: number;
  confirmed_instructor2_fee: number;
  payment_status: string;
}

interface Inquiry {
  id: string;
  no: string;
  location: string;
  institution: string;
  class_type: string;
}

interface PaymentSummary {
  classId: string;
  inquiry: Inquiry | null;
  mainInstructor: string;
  mainInstructorAccount: string;
  subInstructor: string;
  subInstructorAccount: string;
  mainInstructorHours: number;
  subInstructorHours: number;
  mainInstructorFee: number;
  subInstructorFee: number;
  totalPayment: number;
  period: string;
  status: string;
}

export default function PaymentCalculationPage() {
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [classSchedules, setClassSchedules] = useState<ClassSchedule[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [paymentSummaries, setPaymentSummaries] = useState<PaymentSummary[]>([])
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [selectedSchedule, setSelectedSchedule] = useState<{ schedules: ClassSchedule[], instructor: string } | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: instructorData } = await supabase
      .from('instructor_profiles')
      .select('*')
    const { data: classScheduleData } = await supabase
      .from('class_schedule')
      .select('*')
    const { data: classData } = await supabase
      .from('classes')
      .select('*')
    const { data: inquiryData } = await supabase
      .from('inquiries')
      .select('*')

    setInstructors(instructorData ?? [])
    setClassSchedules(classScheduleData ?? [])
    setClasses(classData ?? [])
    setInquiries(inquiryData ?? [])

    calculatePayments(instructorData ?? [], classScheduleData ?? [], classData ?? [], inquiryData ?? [])
  }


  const calculatePayments = (instructors: Instructor[], classSchedules: ClassSchedule[], classes: Class[], inquiries: Inquiry[]) => {
    const classSummaryMap = new Map<string, PaymentSummary>()
  
    classSchedules.forEach(schedule => {
      const classItem = classes.find(cls => cls.id === schedule.class_id)
      const inquiry = inquiries.find(inq => inq.id === classItem?.inquiry_id) || null
  
      const mainInstructor = Array.isArray(schedule.main_instructor) && schedule.main_instructor.length > 0 && instructors 
        ? instructors.find(inst => inst.id === schedule.main_instructor[0])
        : null
      const subInstructor = Array.isArray(schedule.sub_instructor) && schedule.sub_instructor.length > 0 && instructors 
        ? instructors.find(inst => inst.id === schedule.sub_instructor[0])
        : null
  
      const classSummary = classSummaryMap.get(schedule.class_id) || {
        classId: schedule.class_id,
        inquiry,
        mainInstructor: mainInstructor?.name || '',
        mainInstructorAccount: mainInstructor?.account_number || '',
        subInstructor: subInstructor?.name || '',
        subInstructorAccount: subInstructor?.account_number || '',
        mainInstructorHours: 0,
        subInstructorHours: 0,
        mainInstructorFee: classItem?.confirmed_instructor1_fee || 0,
        subInstructorFee: classItem?.confirmed_instructor2_fee || 0,
        totalPayment: 0,
        period: '',
        status: classItem?.payment_status || '미정산'
      }
  
      const scheduleDate = new Date(schedule.schedule_date).toISOString().split('T')[0];
      if (!classSummary.period) {
        classSummary.period = `${scheduleDate}~${scheduleDate}`;
      } else {
        const [startDate, endDate] = classSummary.period.split('~');
        if (new Date(scheduleDate) < new Date(startDate)) {
          classSummary.period = `${scheduleDate}~${endDate}`;
        } else if (new Date(scheduleDate) > new Date(endDate)) {
          classSummary.period = `${startDate}~${scheduleDate}`;
        }
      }
  
      const classHours = Number(schedule.end_period) - Number(schedule.start_period) + 1;
      if (mainInstructor) {
        classSummary.mainInstructorHours += classHours;
        classSummary.totalPayment += (Number(classSummary.mainInstructorFee) * classHours);
      }
      if (subInstructor) {
        classSummary.subInstructorHours += classHours;
        classSummary.totalPayment += (Number(classSummary.subInstructorFee) * classHours);
      }
  
      classSummaryMap.set(schedule.class_id, classSummary);
    });
  
    const updatedClassSummaries = Array.from(classSummaryMap.values()).map(summary => {
      const [startDate, endDate] = summary.period.split('~');
      if (startDate === endDate) {
        summary.period = startDate;
      }
      return summary;
    });
  
    setPaymentSummaries(updatedClassSummaries.sort((a, b) => {
      const aNo = a.inquiry?.no ? parseInt(a.inquiry.no) : 0;
      const bNo = b.inquiry?.no ? parseInt(b.inquiry.no) : 0;
      return bNo - aNo;
    }));
  }
  

  const handleCalculate = async (classId: string, newStatus: string) => {
    const updatedSummaries = paymentSummaries.map(summary => 
      summary.classId === classId ? { ...summary, status: newStatus } : summary
    )
    setPaymentSummaries(updatedSummaries)
    
    const { error } = await supabase
      .from('classes')
      .update({ payment_status: newStatus })
      .eq('id', classId)

    if (error) {
      console.error('Error updating payment status:', error)
    } else {
      console.log('Payment status updated successfully')
    }
  }

  const handleCopy = (text: string) => {
    const onlyNumbers = text.replace(/[^0-9]/g, '');
    navigator.clipboard.writeText(onlyNumbers)
      .then(() => alert('계좌번호가 복사되었습니다.'))
      .catch(err => console.error('Failed to copy: ', err));
  }

  const handleShowSchedule = (classId: string, instructorId: string) => {
    const relevantSchedules = classSchedules.filter(schedule => schedule.class_id === classId &&
      (schedule.main_instructor.includes(instructorId) || schedule.sub_instructor.includes(instructorId)))
    setSelectedSchedule({ schedules: relevantSchedules, instructor: instructorId })
  }

  const handleClosePopup = () => {
    setSelectedSchedule(null)
  }

  const filteredSummaries = paymentSummaries.filter(summary => {
    const matchesStatus = filterStatus === 'all' || summary.status === filterStatus;
    const matchesSearch = summary.mainInstructor.includes(searchTerm) || summary.subInstructor.includes(searchTerm) || summary.inquiry?.institution.includes(searchTerm);
    return matchesStatus && matchesSearch;
  });

  const paginatedSummaries = filteredSummaries.slice((currentPage - 1) * 20, currentPage * 20);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>강사 수당 정산</h1>
      <div className={styles.searchContainer}>
        <input 
          type="text" 
          placeholder="강사 이름 또는 기관 이름 검색" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </div>
      <table className={styles.paymentTable}>
        <thead>
          <tr>
            <th>No</th>
            <th>지역</th>
            <th>기관</th>
            <th>수업 종류</th>
            <th>주강사</th>
            <th>보조강사</th>
            <th className={styles.rightAlign}>총 수업 시간수</th>
            <th className={styles.rightAlign}>강사비</th>
            <th className={styles.rightAlign}>수업료 금액</th>
            <th>
              상태
              <select onChange={(e) => setFilterStatus(e.target.value)} value={filterStatus}>
                <option value="all">전체</option>
                <option value="미정산">미정산</option>
                <option value="정산완료">정산완료</option>
              </select>
            </th>
            <th>정산</th>
          </tr>
        </thead>
        <tbody>
          {paginatedSummaries.map(summary => (
            <tr key={summary.classId}>
              <td>{summary.inquiry?.no}</td>
              <td>{summary.inquiry?.location}</td>
              <td>{summary.inquiry?.institution}</td>
              <td>{summary.inquiry?.class_type}</td>
              <td>
                {summary.mainInstructor && (
                  <>
                    {summary.mainInstructor} <br />
                    ({summary.mainInstructorAccount})
                    <FaCopy className={styles.copyIcon} onClick={() => handleCopy(summary.mainInstructorAccount)} />
                  </>
                )}
              </td>
              <td>
                {summary.subInstructor && (
                  <>
                    {summary.subInstructor} <br />
                    ({summary.subInstructorAccount})
                    <FaCopy className={styles.copyIcon} onClick={() => handleCopy(summary.subInstructorAccount)} />
                  </>
                )}
              </td>
              <td className={styles.rightAlign}>
                {summary.mainInstructor ? (
                  <>
                    <span onClick={() => handleShowSchedule(summary.classId, summary.mainInstructor)}>{summary.mainInstructorHours.toLocaleString()} 시간</span>
                    {summary.subInstructor && <br />}
                  </>
                ) : null}
                {summary.subInstructor && (
                  <span onClick={() => handleShowSchedule(summary.classId, summary.subInstructor)}>{summary.subInstructorHours.toLocaleString()} 시간</span>
                )}
              </td>
              <td className={styles.rightAlign}>{summary.mainInstructorFee.toLocaleString()} 원</td>
              <td className={styles.rightAlign}>{summary.totalPayment.toLocaleString()} 원</td>
              <td>
                <select value={summary.status} onChange={(e) => handleCalculate(summary.classId, e.target.value)}>
                  <option value="미정산">미정산</option>
                  <option value="정산완료">정산완료</option>
                </select>
              </td>
              <td><button onClick={() => handleCalculate(summary.classId, '정산완료')}>정산하기</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className={styles.pagination}>
        {Array(Math.ceil(filteredSummaries.length / 20)).fill(null).map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentPage(index + 1)}
            className={currentPage === index + 1 ? styles.activePage : ''}
          >
            {index + 1}
          </button>
        ))}
      </div>
      {selectedSchedule && (
        <div className={styles.popup}>
          <div className={styles.popupContent}>
            <h2>스케줄 상세 정보</h2>
            <table>
              <thead>
                <tr>
                  <th>날짜</th>
                  <th>시작 시간</th>
                  <th>종료 시간</th>
                </tr>
              </thead>
              <tbody>
                {selectedSchedule.schedules.map(schedule => (
                  <tr key={schedule.schedule_date}>
                    <td>{new Date(schedule.schedule_date).toLocaleDateString()}</td>
                    <td>{schedule.start_period}</td>
                    <td>{schedule.end_period}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={handleClosePopup}>닫기</button>
          </div>
        </div>
      )}
    </div>
  )
}
