import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Certification {
  type: string;
  date: string;
}

interface Profile {
  name: string;
  phone: string;
  email: string;
  certifications: Certification[];
  bankAccount: string;
  ssn: string;
}

interface Props {
  userId: string | null;
}

const InstructorProfileForm: React.FC<Props> = ({ userId }) => {
  const [profile, setProfile] = useState<Profile>({
    name: '',
    phone: '',
    email: '',
    certifications: [{ type: '', date: '' }],
    bankAccount: '',
    ssn: '',
  });
  const [showSSN, setShowSSN] = useState(false);
  const [agreement, setAgreement] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  const fetchProfile = async () => {
    // Fetch profile data from your database
  };

  const handleCertificationChange = (index: number, key: keyof Certification, value: string) => {
    const updatedCertifications = [...profile.certifications];
    updatedCertifications[index][key] = value;
    setProfile({ ...profile, certifications: updatedCertifications });
  };

  const addCertification = () => {
    setProfile({ ...profile, certifications: [...profile.certifications, { type: '', date: '' }] });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Submit profile data to your database
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <input
          type="checkbox"
          checked={agreement}
          onChange={() => setAgreement(!agreement)}
        />
        개인정보 수집 및 이용 동의
      </div>
      <div>
        <label>강사 이름</label>
        <input type="text" name="name" value={profile.name} onChange={handleChange} />
      </div>
      <div>
        <label>전화번호</label>
        <input type="text" name="phone" value={profile.phone} onChange={handleChange} />
      </div>
      <div>
        <label>이메일</label>
        <input type="email" name="email" value={profile.email} onChange={handleChange} />
      </div>
      <div>
        <label>자격증</label>
        {profile.certifications.map((cert, index) => (
          <div key={index}>
            <input
              type="text"
              placeholder="자격증 종류"
              value={cert.type}
              onChange={(e) => handleCertificationChange(index, 'type', e.target.value)}
            />
            <input
              type="date"
              value={cert.date}
              onChange={(e) => handleCertificationChange(index, 'date', e.target.value)}
            />
          </div>
        ))}
        <button type="button" onClick={addCertification}>+ 자격증 추가</button>
      </div>
      <div>
        <label>계좌번호</label>
        <input type="text" name="bankAccount" value={profile.bankAccount} onChange={handleChange} />
      </div>
      <div>
        <label>주민등록번호</label>
        <input
          type={showSSN ? 'text' : 'password'}
          name="ssn"
          value={profile.ssn}
          onChange={handleChange}
        />
        <button type="button" onClick={() => setShowSSN(!showSSN)}>
          {showSSN ? '가림' : '보기'}
        </button>
      </div>
      <button type="submit">저장</button>
    </form>
  );
};

export default InstructorProfileForm;
