// Test page for calendar improvements
import React, { useState } from 'react';
import DateRangePicker from '@/components/ui/DateRangePicker';

interface DateRange {
  from: Date;
  to: Date;
}

export default function TestCalendarPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Test Calendar Desktop Layout
          </h1>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range Picker Test:
              </label>
              <div className="max-w-md">
                <DateRangePicker
                  dateRange={dateRange}
                  onDateRangeChange={setDateRange}
                  placeholder="Select date range"
                  isMobile={false}
                />
              </div>
            </div>

            {dateRange && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <h3 className="text-sm font-medium text-green-800 mb-2">
                  Selected Date Range:
                </h3>
                <p className="text-sm text-green-700">
                  From: {dateRange.from.toLocaleDateString('id-ID')}
                  <br />
                  To: {dateRange.to.toLocaleDateString('id-ID')}
                </p>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2">
                Desktop Improvements Made:
              </h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Wider layout (lg:min-w-[600px])</li>
                <li>• Horizontal layout at lg breakpoint (1024px+)</li>
                <li>• Preset sidebar with proper spacing</li>
                <li>• Dual calendar months on larger screens</li>
                <li>• Better button spacing and sizing</li>
                <li>• Orange-themed action buttons</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
