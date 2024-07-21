// Notification.tsx
'use client';

import { useState, useEffect } from 'react';
import styles from './Notification.module.css';

interface NotificationProps {
  message: string;
}

const Notification: React.FC<NotificationProps> = ({ message }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className={styles.notification}>
      {message}
    </div>
  );
};

export default Notification;
