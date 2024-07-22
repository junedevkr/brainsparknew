'use client';

import React, { useState, useEffect, ChangeEvent } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import styles from './InstructorProfilePage.module.css';
import { useRouter } from 'next/navigation';

interface Props {
  params?: { [key: string]: string };
}
interface ProfilePageProps {
  params: {
    id: string;
  };
}

interface Certificate {
  type: string;
  date: string;
  institution: string;
}

interface Profile {
  name: string;
  phone: string;
  email: string;
  certificates: Certificate[];
  account_number: string;
  ssn: string;
  agreement: boolean;
}

interface ClassSummary {
  location: string;
  institution: string;
  classType: string;
  period: string;
  totalHours: number;
}

const AgreementPopup = ({ onClose, onAgree }: { onClose: () => void, onAgree: () => void }) => {
  return (
    <div className={styles.popup}>
      <div className={styles.popupContent}>
        <h2>개인정보 수집 및 이용 동의</h2>
        <p>개인정보 수집 및 이용에 대한 내용을 여기에 작성합니다.</p>
        <button onClick={onAgree}>동의</button>
        <button onClick={onClose}>닫기</button>
      </div>
    </div>
  );
};

type EditableFields = keyof Profile;

export default function InstructorProfilePage({ params }: ProfilePageProps) {
  const [profileData, setProfileData] = useState<Profile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [isEditing, setIsEditing] = useState<Record<EditableFields, boolean>>({
    name: false,
    phone: false,
    email: false,
    certificates: false,
    account_number: false,
    ssn: false,
    agreement: false,
  });
  const [newCertificates, setNewCertificates] = useState<Certificate[]>([{ type: '', date: '', institution: '' }]);
  const [showPopup, setShowPopup] = useState(false);
  const [classSummaries, setClassSummaries] = useState<ClassSummary[]>([]);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      checkAuthorization();
    }
  }, [currentUserId, params.id]);

  const fetchCurrentUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      setCurrentUserId(user?.id || null);
    } catch (error) {
      console.error('Error fetching current user:', error);
      setError('Failed to fetch user data');
    }
  };

  const checkAuthorization = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!currentUserId) {
        throw new Error('User not authenticated');
      }
  
      const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('id', currentUserId)
      .single();
      
      if (error) {
        throw error;
      }
  
      if (!data) {
        throw new Error('User role not found');
      }
  
      const isAdmin = data.role === 'admin' || data.role === 'superadmin';
      setIsAdmin(isAdmin);
  
      if (currentUserId !== params.id && !isAdmin) {
        router.push('/unauthorized');
        return;
      }
  
      await fetchProfileData();
      await fetchClassSummaries();
    } catch (error) {
      console.error('Error checking authorization:', error);
      if (error instanceof Error) {
        setError(`Failed to check authorization: ${error.message}`);
      } else {
        setError('An unknown error occurred while checking authorization');
      }
    } finally {
      setIsLoading(false);
    }
  };

const fetchProfileData = async () => {
  try {
    const { data, error } = await supabase
      .from('instructor_profiles')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error('Profile not found');
    }

    setProfileData({
      name: data.name,
      phone: data.phone,
      email: data.email,
      certificates: data.certificates ? JSON.parse(data.certificates) : [],
      account_number: data.account_number,
      ssn: data.ssn,
      agreement: data.agreement,
    });
  } catch (error) {
    console.error('Error fetching profile data:', error);
    if (error instanceof Error) {
      setError(`Failed to fetch profile data: ${error.message}`);
    } else {
      setError('An unknown error occurred while fetching profile data');
    }
  }
};

  const fetchClassSummaries = async () => {
    try {
      const { data: schedules, error: scheduleError } = await supabase
        .from('class_schedule')
        .select('*')
        .or(`main_instructor.cs.{${params.id}},sub_instructor.cs.{${params.id}}`);

      if (scheduleError) throw scheduleError;

      const { data: classes, error: classError } = await supabase
        .from('classes')
        .select('*');

      if (classError) throw classError;

      const { data: inquiries, error: inquiryError } = await supabase
        .from('inquiries')
        .select('*');

      if (inquiryError) throw inquiryError;

      const classSummaryMap = new Map<string, ClassSummary>();

      schedules.forEach(schedule => {
        const classItem = classes.find(cls => cls.id === schedule.class_id);
        const inquiry = inquiries.find(inq => inq.id === classItem?.inquiry_id);
        const classSummary = classSummaryMap.get(schedule.class_id) || {
          location: inquiry?.location || '',
          institution: inquiry?.institution || '',
          classType: inquiry?.class_type || '',
          period: '',
          totalHours: 0
        };

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
        classSummary.totalHours += schedule.end_period - schedule.start_period + 1;
        classSummaryMap.set(schedule.class_id, classSummary);
      });

      const updatedClassSummaries = Array.from(classSummaryMap.values()).map(summary => {
        const [startDate, endDate] = summary.period.split('~');
        if (startDate === endDate) {
          summary.period = startDate;
        }
        return summary;
      });

      setClassSummaries(updatedClassSummaries);
    } catch (error) {
      console.error('Error fetching class summaries:', error);
      setError('Failed to fetch class summaries');
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prevData => prevData ? ({
      ...prevData,
      [name]: value
    }) : null);
  };

  const handleCertificateChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    const { name, value } = e.target;
    setProfileData(prevData => {
      if (!prevData) return null;
      const updatedCertificates = [...prevData.certificates];
      updatedCertificates[index] = { ...updatedCertificates[index], [name]: value };
      return { ...prevData, certificates: updatedCertificates };
    });
  };

  const handleNewCertificateChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    const { name, value } = e.target;
    setNewCertificates(prevData => {
      const updatedNewCertificates = [...prevData];
      updatedNewCertificates[index] = { ...updatedNewCertificates[index], [name]: value };
      return updatedNewCertificates;
    });
  };

  const handleSave = async (field: EditableFields) => {
    setIsEditing(prev => ({ ...prev, [field]: false }));
  
    if (!profileData) return;
  
    const updatedProfile = { [field]: profileData[field as keyof Profile] };
    const { error } = await supabase
      .from('instructor_profiles')
      .update(updatedProfile)
      .eq('id', params.id);
  
    if (error) {
      console.error('Error updating profile data:', error);
    } else {
      console.log('Profile updated successfully');
      fetchProfileData();
    }
  };
  
  const handleSaveCertificates = async () => {
    if (!profileData) return;

    const updatedCertificates = profileData.certificates;
    const { error } = await supabase
      .from('instructor_profiles')
      .update({ certificates: JSON.stringify(updatedCertificates) })
      .eq('id', params.id);

    if (error) {
      console.error('Error updating certificate data:', error);
    } else {
      console.log('Certificate updated successfully');
      setIsEditing(prev => ({ ...prev, certificates: false }));
      fetchProfileData();
    }
  };

  const handleAddCertificate = async () => {
    if (!profileData) return;

    const updatedCertificates = [...profileData.certificates, ...newCertificates];
    const { error } = await supabase
      .from('instructor_profiles')
      .update({ certificates: JSON.stringify(updatedCertificates) })
      .eq('id', params.id);

    if (error) {
      console.error('Error adding certificate:', error);
    } else {
      setProfileData(prevData => prevData ? ({
        ...prevData,
        certificates: updatedCertificates
      }) : null);
      setNewCertificates([{ type: '', date: '', institution: '' }]);
      fetchProfileData();
    }
  };

  const handleDeleteCertificate = async (index: number) => {
    if (!profileData) return;

    const updatedCertificates = profileData.certificates.filter((_, i) => i !== index);
    const { error } = await supabase
      .from('instructor_profiles')
      .update({ certificates: JSON.stringify(updatedCertificates) })
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting certificate:', error);
    } else {
      setProfileData(prevData => prevData ? ({
        ...prevData,
        certificates: updatedCertificates
      }) : null);
      console.log('Certificate deleted successfully');
      fetchProfileData();
    }
  };

  const handleAgreement = async () => {
    setShowPopup(true);
  };

  const handleAgreementConfirm = async () => {
    const { error } = await supabase
      .from('instructor_profiles')
      .update({ agreement: true })
      .eq('id', params.id);

    if (error) {
      console.error('Error updating agreement:', error);
    } else {
      setProfileData(prevData => prevData ? ({
        ...prevData,
        agreement: true
      }) : null);
      setShowPopup(false);
    }
  };

  const toggleEdit = (field: EditableFields) => {
    setIsEditing(prev => ({ ...prev, [field]: !prev[field] }));
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={checkAuthorization}>Retry</button>
      </div>
    );
  }
  
  if (!profileData) {
    return <div>Profile not found</div>;
  }
  
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{isAdmin && params.id !== currentUserId ? `${profileData?.name}의 프로필` : '나의 프로필'}</h1>
      {profileData ? (
        <div>
          <div className={styles.profileSection}>
            <h2>개인정보보호 이용동의</h2>
            <label>
              <input
                type="checkbox"
                checked={profileData.agreement}
                onChange={handleAgreement}
                disabled={profileData.agreement}
              />
              개인정보 수집 및 이용에 동의합니다.
            </label>
          </div>

          <div className={styles.profileSection}>
            <h2>
              개인정보
              {(isEditing.name || isEditing.phone || isEditing.email || isEditing.account_number || isEditing.ssn) ? (
                <button onClick={() => {
                    handleSave('name' as EditableFields);
                    handleSave('phone' as EditableFields);
                    handleSave('email' as EditableFields);
                    handleSave('account_number' as EditableFields);
                    handleSave('ssn' as EditableFields);
                  }} className={styles.saveButton}>저장</button>
              ) : (
                <button onClick={() => {
                    toggleEdit('name' as EditableFields);
                    toggleEdit('phone' as EditableFields);
                    toggleEdit('email' as EditableFields);
                    toggleEdit('account_number' as EditableFields);
                    toggleEdit('ssn' as EditableFields);
                  }} className={styles.editButton}>수정</button>
              )}
            </h2>
            <table className={styles.profileTable}>
              <tbody>
              <tr>
                <th className={styles.label}>이메일(로그인겸용)</th>
                <td className={styles.value}>
                  <div className={styles.editableField}>
                    {profileData.email}
                  </div>
                </td>
              </tr>
              {[
                { field: 'name' as EditableFields, label: '이름' },
                { field: 'phone' as EditableFields, label: '전화번호' },
                { field: 'account_number' as EditableFields, label: '은행 - 계좌번호' },
                { field: 'ssn' as EditableFields, label: '주민등록번호' }
              ].map(({ field, label }) => (
                <tr key={field}>
                  <th className={styles.label}>{label}</th>
                  <td className={styles.value}>
                    {isEditing[field] ? (
                      <input
                        type="text"
                        name={field}
                        value={profileData[field] as string}
                        onChange={handleInputChange}
                        autoFocus
                      />
                    ) : (
                      <div className={styles.editableField}>
                        {profileData[field] as string}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
                </tbody>
            </table>
          </div>

          <div className={styles.profileSection}>
            <h2>
              자격증
              {isEditing.certificates ? (
                <button onClick={handleSaveCertificates} className={styles.saveButton}>저장</button>
              ) : (
                <button onClick={() => toggleEdit('certificates')} className={styles.editButton}>수정</button>
              )}
            </h2>
            <table className={styles.profileTable}>
              <thead>
                <tr>
                  <th>종류</th>
                  <th>기관</th>
                  <th>날짜</th>
                  {isEditing.certificates && <th>삭제</th>}
                </tr>
              </thead>
              <tbody>
                {profileData.certificates.length > 0 ? (
                  profileData.certificates.map((certificate, index) => (
                    <tr key={index}>
                      <td>
                        {isEditing.certificates ? (
                          <input
                            type="text"
                            name="type"
                            value={certificate.type}
                            onChange={(e) => handleCertificateChange(e, index)}
                            autoFocus
                          />
                        ) : (
                          <div className={styles.fieldContent}>{certificate.type}</div>
                        )}
                      </td>
                      <td>
                        {isEditing.certificates ? (
                          <input
                            type="text"
                            name="institution"
                            value={certificate.institution}
                            onChange={(e) => handleCertificateChange(e, index)}
                            autoFocus
                          />
                        ) : (
                          <div className={styles.fieldContent}>{certificate.institution}</div>
                        )}
                      </td>
                      <td>
                        {isEditing.certificates ? (
                          <input
                            type="text"
                            name="date"
                            value={certificate.date}
                            onChange={(e) => handleCertificateChange(e, index)}
                            autoFocus
                          />
                        ) : (
                          <div className={styles.fieldContent}>{certificate.date}</div>
                        )}
                      </td>
                      {isEditing.certificates && (
                        <td>
                          <button onClick={() => handleDeleteCertificate(index)} className={styles.deleteButton}>삭제</button>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4}>등록된 자격증이 없습니다.</td>
                  </tr>
                )}
                {isEditing.certificates && newCertificates.map((newCertificate, index) => (
                  <tr key={`new-${index}`}>
                    <td>
                      <input
                        type="text"
                        name="type"
                        value={newCertificate.type}
                        onChange={(e) => handleNewCertificateChange(e, index)}
                        placeholder="자격증 종류"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        name="institution"
                        value={newCertificate.institution}
                        onChange={(e) => handleNewCertificateChange(e, index)}
                        placeholder="기관"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        name="date"
                        value={newCertificate.date}
                        onChange={(e) => handleNewCertificateChange(e, index)}
                        placeholder="날짜"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {isEditing.certificates && (
              <button onClick={handleAddCertificate} className={styles.addButton}>추가</button>
            )}
          </div>

          <div className={styles.profileSection}>
            <h2>출강 이력</h2>
            <table className={styles.profileTable}>
              <thead>
                <tr>
                  <th>지역</th>
                  <th>기관</th>
                  <th>수업 종류</th>
                  <th>기간</th>
                  <th>총 수업 시간수</th>
                </tr>
              </thead>
              <tbody>
                {classSummaries.length > 0 ? (
                  classSummaries.map((summary, index) => (
                    <tr key={index}>
                      <td>{summary.location}</td>
                      <td>{summary.institution}</td>
                      <td>{summary.classType}</td>
                      <td>{summary.period}</td>
                      <td>{summary.totalHours} 시간</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5}>출강 이력이 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p>로딩 중...</p>
      )}

      {showPopup && (
        <AgreementPopup
          onClose={() => setShowPopup(false)}
          onAgree={handleAgreementConfirm}
        />
      )}
    </div>
  );
}
