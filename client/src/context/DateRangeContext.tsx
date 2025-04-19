// client/src/context/DateRangeContext.tsx
import React, { createContext, useState, useContext } from 'react';

interface DateRangeContextType {
  dateRange: string;
  setDateRange: (range: string) => void;
}

const DateRangeContext = createContext<DateRangeContextType>({
  dateRange: '30', // Default value
  setDateRange: () => {},
});

export const DateRangeProvider = ({ children }: { children: React.ReactNode }) => {
  const [dateRange, setDateRange] = useState('30');

  return (
    <DateRangeContext.Provider value={{ dateRange, setDateRange }}>
      {children}
    </DateRangeContext.Provider>
  );
};

export const useDateRange = () => useContext(DateRangeContext);