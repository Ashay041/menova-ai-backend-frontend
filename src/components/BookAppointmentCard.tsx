import React from "react";
import { Button } from "@/components/ui/button";

export default function BookAppointmentCard({ onBook }: { onBook: () => void }) {
  return (
    <div className="bg-[#FFF7F0] rounded-3xl border border-[#FFD7D0] shadow-md p-6 flex flex-col items-start mb-4">
      <div className="flex items-center space-x-4 w-full">
        <div className="flex-shrink-0 bg-[#FFE18B] rounded-full p-3 flex items-center justify-center">
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#F26158" strokeWidth="2">
            <rect x="4" y="4" width="16" height="16" rx="6" fill="#FFE18B" />
            <path d="M8 9h8M8 13h6M8 17h4" stroke="#F26158" strokeWidth="2" strokeLinecap="round" />
            <circle cx="18" cy="8" r="2" fill="#F26158" />
          </svg>
        </div>
        <div className="flex-1">
          <div className="font-semibold text-lg text-[#F26158]">Book a Doctor’s Appointment</div>
          <div className="text-[#4B2221] text-sm mt-1">Find the right specialist for your needs</div>
        </div>
      </div>
      <Button className="bg-[#F26158] text-white rounded-full px-6 py-2 text-base font-medium hover:bg-[#e4574d] shadow w-full mt-6 self-end" onClick={onBook}>
        Book Now
      </Button>
    </div>
  );
}
