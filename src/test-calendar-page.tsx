// Test page for calendar improvements
import React, { useState } from 'react';
import DateRangePicker from '@/components/ui/DateRangePicker';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface DateRange {
  from: Date;
  to: Date;
}

export default function TestCalendarPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [singleDate, setSingleDate] = useState<Date | undefined>();
  const [mobileDateRange, setMobileDateRange] = useState<DateRange | undefined>();

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
            📅 Calendar Responsiveness Test
          </h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Desktop Tests */}
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">
                Desktop Calendar Tests
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📊 Date Range Picker (Desktop):
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
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📅 Single Date Picker (Like Purchase Dialog):
                </label>
                <div className="max-w-md">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-full justify-start text-left font-normal input-mobile-safe ${
                          !singleDate && 'text-muted-foreground'
                        }`}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                        <span className="truncate">
                          {singleDate ? format(singleDate, 'PPP', { locale: id }) : 'Pilih tanggal'}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent 
                      className="w-auto p-0 z-[9999] calendar-popover-content" 
                      align="start"
                      side="bottom"
                      sideOffset={8}
                      avoidCollisions
                      collisionPadding={16}
                    >
                      <Calendar
                        mode="single"
                        selected={singleDate}
                        onSelect={setSingleDate}
                        initialFocus
                        locale={id}
                        className="calendar-responsive"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
            
            {/* Mobile Tests */}
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">
                Mobile Calendar Tests
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📱 Date Range Picker (Mobile):
                </label>
                <div className="max-w-md">
                  <DateRangePicker
                    dateRange={mobileDateRange}
                    onDateRangeChange={setMobileDateRange}
                    placeholder="Select mobile date range"
                    isMobile={true}
                  />
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <h3 className="text-sm font-medium text-yellow-800 mb-2">
                  📱 Mobile Testing Instructions:
                </h3>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Open dev tools and toggle device toolbar</li>
                  <li>• Test iPhone SE (375px), iPad (768px), iPhone Pro Max (428px)</li>
                  <li>• Verify calendar doesn't overflow screen</li>
                  <li>• Check touch targets are at least 44px</li>
                  <li>• Test both portrait and landscape</li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* Results Section */}
          <div className="mt-8 space-y-4">
            {dateRange && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <h3 className="text-sm font-medium text-green-800 mb-2">
                  ✅ Desktop Date Range Selected:
                </h3>
                <p className="text-sm text-green-700">
                  From: {dateRange.from.toLocaleDateString('id-ID')}
                  <br />
                  To: {dateRange.to.toLocaleDateString('id-ID')}
                </p>
              </div>
            )}
            
            {mobileDateRange && (
              <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
                <h3 className="text-sm font-medium text-purple-800 mb-2">
                  📱 Mobile Date Range Selected:
                </h3>
                <p className="text-sm text-purple-700">
                  From: {mobileDateRange.from.toLocaleDateString('id-ID')}
                  <br />
                  To: {mobileDateRange.to.toLocaleDateString('id-ID')}
                </p>
              </div>
            )}
            
            {singleDate && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h3 className="text-sm font-medium text-blue-800 mb-2">
                  📅 Single Date Selected:
                </h3>
                <p className="text-sm text-blue-700">
                  Date: {singleDate.toLocaleDateString('id-ID')}
                </p>
              </div>
            )}

            <div className="bg-emerald-50 border border-emerald-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-emerald-800 mb-2">
                🚀 Responsive Improvements Made:
              </h3>
              <ul className="text-sm text-emerald-700 space-y-1">
                <li>• ✅ Responsive min-width constraints (280px → 800px+)</li>
                <li>• ✅ Improved z-index hierarchy (z-[9999])</li>
                <li>• ✅ Better collision detection and padding</li>
                <li>• ✅ Mobile-optimized calendar cell sizes</li>
                <li>• ✅ Tablet-specific breakpoint adjustments</li>
                <li>• ✅ Popover content max-width protection</li>
                <li>• ✅ Enhanced calendar responsive class</li>
                <li>• ✅ Touch-safe button sizing (44px minimum)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
