import React from 'react';
interface Props {
  onClose: () => void;
}

const AgreementPopup: React.FC<Props> = ({ onClose }) => (
  <div className="popup">
    <div className="popup-content">
      <h2>개인정보 수집 및 이용 동의</h2>
      <p>여기에 개인정보 수집 및 이용 동의 내용을 작성하세요.</p>
      <button onClick={onClose}>닫기</button>
    </div>
  </div>
);

export default AgreementPopup;
