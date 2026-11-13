import React from 'react';
import { X } from 'lucide-react';

interface NameInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const NameInput: React.FC<NameInputProps> = ({ value, onChange }) => {
  return (
    <div className="w-full">
      <label
        htmlFor="supporter-full-name"
        className="block text-xs font-semibold text-[#33447A] mb-1.5"
      >
        Your Full Name
      </label>
      <div className="relative flex items-center">
        <input
          id="supporter-full-name"
          type="text"
          value={value}
          maxLength={64}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter Your Full Name and Surname"
          autoComplete="name"
          className="w-full min-h-[48px] bg-white text-[#0A194E] placeholder:text-[#7A86A6] border border-[#CFD7E6] rounded-lg px-4 pr-10 py-2.5 text-sm sm:text-base font-medium transition-colors focus:outline-none focus:border-[#0A226E] focus:ring-2 focus:ring-[#0A226E]/15"
        />
        {value.length > 0 && (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Clear name"
            className="absolute right-2.5 p-1.5 rounded-md text-[#647194] hover:text-[#0A194E] hover:bg-[#EEF2F8] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
};
