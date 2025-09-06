import React, { useState, useEffect } from 'react';
import DateRangePicker from '@/components/ui/DateRangePicker';
import { safeDom } from '@/utils/browserApiSafeWrappers';


interface DateRange {
  from: Date;
  to: Date;
}

export default function DebugCalendar() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [windowWidth, setWindowWidth] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    handleResize();
    safeDom.addEventListener(safeDom, window, 'resize', handleResize);
    return () => safeDom.removeEventListener(safeDom, window, 'resize', handleResize);
  }, []);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h1 className="text-2xl font-bold mb-4">Calendar Debug</h1>
          
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-2">Current Screen Info:</h3>
              <p className="text-blue-700 text-sm">
                Width: {windowWidth}px<br/>
                Breakpoint: {windowWidth >= 768 ? 'Desktop (md+)' : 'Mobile'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Calendar (should be horizontal on desktop ≥768px):
              </label>
              <DateRangePicker
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                placeholder="Click to test calendar layout"
                isMobile={false}
              />
            </div>

            {dateRange && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-medium text-green-800 mb-2">Selected:</h3>
                <p className="text-green-700 text-sm">
                  {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
                </p>
              </div>
            )}

            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-medium text-yellow-800 mb-2">Expected Layout:</h3>
              <ul className="text-yellow-700 text-sm space-y-1">
                <li>• Width &lt; 768px: Vertical (presets above calendar)</li>
                <li>• Width ≥ 768px: Horizontal (presets left, calendar right)</li>
                <li>• Preset sidebar width: 160px (md:w-40)</li>
                <li>• Dual calendar on wide screens</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
