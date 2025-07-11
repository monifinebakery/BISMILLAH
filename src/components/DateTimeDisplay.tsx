
import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

const DateTimeDisplay = () => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  return (
    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
      <Clock className="h-4 w-4" />
      <span className="hidden sm:inline">{formatDateTime(currentDateTime)}</span>
      <span className="sm:hidden">
        {currentDateTime.toLocaleTimeString('id-ID', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
      </span>
    </div>
  );
};

export default DateTimeDisplay;
