'use client';

import { useState } from 'react';
import { Sun, Building2, Moon, Clock } from 'lucide-react';

interface TimingData {
  morning: {
    from: string;
    to: string;
    days: string[];
  };
  evening: {
    from: string;
    to: string;
    days: string[];
  };
  night: {
    from: string;
    to: string;
    days: string[];
  };
}

interface TimingSelectorProps {
  value: TimingData;
  onChange: (value: TimingData) => void;
}

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function TimingSelector({ value, onChange }: TimingSelectorProps) {
  const [timing, setTiming] = useState<TimingData>(value || {
    morning: { from: '', to: '', days: [] },
    evening: { from: '', to: '', days: [] },
    night: { from: '', to: '', days: [] },
  });

  const updateTiming = (shift: 'morning' | 'evening' | 'night', field: 'from' | 'to' | 'days', newValue: string | string[]) => {
    const updated = {
      ...timing,
      [shift]: {
        ...timing[shift],
        [field]: newValue,
      },
    };
    setTiming(updated);
    onChange(updated);
  };

  const handleSelectAll = (shift: 'morning' | 'evening' | 'night') => {
    updateTiming(shift, 'days', [...daysOfWeek]);
  };

  const handleClear = (shift: 'morning' | 'evening' | 'night') => {
    updateTiming(shift, 'days', []);
  };

  const toggleDay = (shift: 'morning' | 'evening' | 'night', day: string) => {
    const currentDays = timing[shift].days;
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day];
    updateTiming(shift, 'days', newDays);
  };

  const renderShift = (
    shift: 'morning' | 'evening' | 'night',
    title: string,
    icon: React.ReactNode
  ) => {
    return (
      <div className="bg-[#ecfdf5] border-l-4 border-[#10b981] rounded-lg p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <button
              type="button"
              onClick={() => handleSelectAll(shift)}
              className="text-[#10b981] hover:text-[#059669] font-medium"
            >
              Select All
            </button>
            <span className="text-gray-300">|</span>
            <button
              type="button"
              onClick={() => handleClear(shift)}
              className="text-gray-500 hover:text-gray-700 font-medium"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
            <div className="relative">
              <input
                type="time"
                value={timing[shift].from}
                onChange={(e) => updateTiming(shift, 'from', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent bg-white pr-10"
                placeholder="--:--"
              />
              <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
            <div className="relative">
              <input
                type="time"
                value={timing[shift].to}
                onChange={(e) => updateTiming(shift, 'to', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent bg-white pr-10"
                placeholder="--:--"
              />
              <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Days</label>
          <div className="flex flex-wrap gap-2">
            {daysOfWeek.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(shift, day)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  timing[shift].days.includes(day)
                    ? 'bg-[#10b981] text-white border-2 border-[#10b981]'
                    : 'bg-white text-gray-600 border-2 border-gray-300 hover:border-[#10b981]'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {renderShift('morning', 'MORNING TIME', <Sun className="h-5 w-5 text-yellow-500" />)}
      {renderShift('evening', 'EVENING TIME', <Building2 className="h-5 w-5 text-[#10b981]" />)}
      {renderShift('night', 'NIGHT TIME', <Moon className="h-5 w-5 text-[#10b981]" />)}
    </div>
  );
}

