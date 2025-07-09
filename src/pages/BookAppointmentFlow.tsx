import React, { useState } from "react";
import { Button } from "@/components/ui/button";

// Step 1: Appointment Type
const appointmentTypes = [
  { key: "video", label: "Video Call", icon: "📹" },
  { key: "phone", label: "Phone Call", icon: "📞" },
  { key: "inperson", label: "In-person", icon: "🏥" },
];

// Step 2: Specialist Recommendation
const specialistRecommendations = [
  {
    key: "gynecologist",
    label: "Gynecologist",
    description: "For menopause-related symptoms, hormonal changes, and overall women's health, a gynecologist is the most relevant specialist. Most menopause users benefit from seeing a gynecologist first.",
  },
  {
    key: "endocrinologist",
    label: "Endocrinologist",
    description: "If you have complex hormonal or metabolic concerns, an endocrinologist can provide additional support.",
  },
  {
    key: "psychologist",
    label: "Psychologist",
    description: "For mental health, mood, or sleep issues, a psychologist can help you cope with menopause-related changes.",
  },
];

// Step 3: Doctor List (sample)
const doctors = [
  {
    id: 1,
    name: "Dr. Emily Carter",
    specialty: "Gynecologist",
    experience: 14,
    rating: 4.9,
  },
  {
    id: 2,
    name: "Dr. Sarah Thompson",
    specialty: "Endocrinologist",
    experience: 11,
    rating: 4.7,
  },
  {
    id: 3,
    name: "Dr. Olivia Martinez",
    specialty: "Psychologist",
    experience: 10,
    rating: 4.8,
  },
];

export default function BookAppointmentFlow({ onComplete }: { onComplete?: () => void }) {
  const [step, setStep] = useState(1);
  const [appointmentType, setAppointmentType] = useState<string | null>(null);
  const [specialist, setSpecialist] = useState<string | null>(null);
  const [doctor, setDoctor] = useState<number | null>(null);
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("");

  // Step 1: Appointment Type
  if (step === 1) {
    return (
      <div className="bg-[#FFF7F0] rounded-3xl border border-[#FFD7D0] shadow-md p-6 max-w-md mx-auto mt-8">
        <h2 className="text-xl font-bold text-[#F26158] mb-2">How would you like to consult?</h2>
        <div className="flex flex-col space-y-3 mt-4">
          {appointmentTypes.map((type) => (
            <Button
              key={type.key}
              className={`flex items-center justify-start bg-white border border-[#FFD7D0] rounded-xl px-4 py-3 text-[#4B2221] text-base font-medium shadow-sm hover:bg-[#FFE18B]/40 ${appointmentType === type.key ? 'ring-2 ring-[#F26158]' : ''}`}
              onClick={() => {
                setAppointmentType(type.key);
                setStep(2);
              }}
            >
              <span className="mr-3 text-2xl">{type.icon}</span> {type.label}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  // Step 2: Specialist Recommendation
  if (step === 2) {
    // Simulate recommendation logic (could be based on user data)
    const recommended = specialistRecommendations[0];
    // Sample: Show earliest-available doctors (could be filtered by symptoms in real app)
    const recommendedDoctors = [
      {
        id: 1,
        name: "Dr. Emily Carter",
        specialty: "Gynecologist",
        nextAvailable: "Today, 3:00 PM",
      },
      {
        id: 2,
        name: "Dr. Sarah Thompson",
        specialty: "Endocrinologist",
        nextAvailable: "Tomorrow, 10:30 AM",
      },
    ];
    return (
      <div className="bg-[#FFF7F0] rounded-3xl border border-[#FFD7D0] shadow-md p-6 max-w-md mx-auto mt-8">
        <h2 className="text-xl font-bold text-[#F26158] mb-4">Recommended Doctors for You</h2>
        <div className="text-[#4B2221] text-base mb-6">
          Based on your recent symptoms, we recommend you see the following doctors who have the earliest openings available:
        </div>
        <div className="flex flex-col space-y-4 mb-6">
          {recommendedDoctors.map((doc) => (
            <div key={doc.id} className="bg-[#FFE18B]/60 border border-[#FFD7D0] rounded-xl p-4 flex flex-col">
              <div className="font-semibold text-[#F26158] text-lg mb-1">{doc.name}</div>
              <div className="text-[#4B2221] text-sm mb-1">{doc.specialty}</div>
              <div className="text-[#4B2221] text-xs mb-2">Next available: {doc.nextAvailable}</div>
              <Button
                className="w-full bg-[#F26158] text-white rounded-full py-2 mt-1"
                onClick={() => {
                  setSpecialist(doc.specialty.toLowerCase());
                  setDoctor(doc.id);
                  setStep(4); // Go directly to pick date/time for this doctor
                }}
              >
                Continue with {doc.name}
              </Button>
            </div>
          ))}
        </div>
        <div className="text-center text-sm text-[#4B2221] my-2">or choose another specialist</div>
        <div className="flex flex-col space-y-2">
          {specialistRecommendations.map((spec) => (
            <Button
              key={spec.key}
              className="bg-white border border-[#FFD7D0] text-[#4B2221] rounded-xl py-2 hover:bg-[#FFE18B]/40"
              onClick={() => {
                setSpecialist(spec.key);
                setDoctor(null);
                setStep(3);
              }}
            >
              {spec.label}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  // Step 3: Choose Doctor
  if (step === 3) {
    const filteredDoctors = doctors.filter((d) => d.specialty.toLowerCase() === specialist);
    return (
      <div className="bg-[#FFF7F0] rounded-3xl border border-[#FFD7D0] shadow-md p-6 max-w-md mx-auto mt-8">
        <h2 className="text-xl font-bold text-[#F26158] mb-2">Select Your Doctor</h2>
        <div className="flex flex-col space-y-3 mt-4">
          {filteredDoctors.map((doc) => (
            <Button
              key={doc.id}
              className={`flex flex-col items-start bg-white border border-[#FFD7D0] rounded-xl px-4 py-3 text-[#4B2221] text-base font-medium shadow-sm hover:bg-[#FFE18B]/40 ${doctor === doc.id ? 'ring-2 ring-[#F26158]' : ''}`}
              onClick={() => {
                setDoctor(doc.id);
                setStep(4);
              }}
            >
              <span className="font-semibold">{doc.name}</span>
              <span className="text-xs text-[#F26158]">{doc.specialty} • {doc.experience} yrs exp • ⭐ {doc.rating}</span>
            </Button>
          ))}
        </div>
      </div>
    );
  }

  // Step 4: Pick Date & Time
  if (step === 4) {
    // For demo, use static dates/times
    const dates = ["2025-04-22", "2025-04-23", "2025-04-24"];
    const times = ["10:00 AM", "2:00 PM", "5:00 PM"];
    return (
      <div className="bg-[#FFF7F0] rounded-3xl border border-[#FFD7D0] shadow-md p-6 max-w-md mx-auto mt-8">
        <h2 className="text-xl font-bold text-[#F26158] mb-2">Pick a Date & Time</h2>
        <div className="mb-4">
          <div className="font-semibold mb-1">Date</div>
          <div className="flex space-x-2">
            {dates.map((d) => (
              <Button
                key={d}
                className={`rounded-lg px-4 py-2 text-[#4B2221] border border-[#FFD7D0] bg-white hover:bg-[#FFE18B]/40 ${date === d ? 'ring-2 ring-[#F26158]' : ''}`}
                onClick={() => setDate(d)}
              >
                {d}
              </Button>
            ))}
          </div>
        </div>
        <div>
          <div className="font-semibold mb-1">Time</div>
          <div className="flex space-x-2">
            {times.map((t) => (
              <Button
                key={t}
                className={`rounded-lg px-4 py-2 text-[#4B2221] border border-[#FFD7D0] bg-white hover:bg-[#FFE18B]/40 ${time === t ? 'ring-2 ring-[#F26158]' : ''}`}
                onClick={() => setTime(t)}
              >
                {t}
              </Button>
            ))}
          </div>
        </div>
        <Button
          className="w-full mt-6 bg-[#F26158] text-white rounded-full py-2"
          disabled={!date || !time}
          onClick={() => setStep(5)}
        >
          Continue
        </Button>
      </div>
    );
  }

  // Step 5: Confirm Details
  if (step === 5) {
    const selectedDoctor = doctors.find((d) => d.id === doctor);
    const selectedSpec = specialistRecommendations.find((s) => s.key === specialist);
    return (
      <div className="bg-[#FFF7F0] rounded-3xl border border-[#FFD7D0] shadow-md p-6 max-w-md mx-auto mt-8">
        <h2 className="text-xl font-bold text-[#F26158] mb-2">Confirm Appointment</h2>
        <div className="bg-white rounded-xl border border-[#FFD7D0] p-4 mb-4">
          <div className="mb-1"><span className="font-semibold">Doctor:</span> {selectedDoctor?.name}</div>
          <div className="mb-1"><span className="font-semibold">Specialty:</span> {selectedSpec?.label}</div>
          <div className="mb-1"><span className="font-semibold">Type:</span> {appointmentTypes.find((a) => a.key === appointmentType)?.label}</div>
          <div className="mb-1"><span className="font-semibold">Date:</span> {date}</div>
          <div className="mb-1"><span className="font-semibold">Time:</span> {time}</div>
        </div>
        <Button
          className="w-full bg-[#F26158] text-white rounded-full py-2 mb-2"
          onClick={() => setStep(6)}
        >
          Confirm Appointment
        </Button>
        <Button variant="outline" className="w-full" onClick={() => setStep(1)}>
          Start Over
        </Button>
      </div>
    );
  }

  // Step 6: Success
  if (step === 6) {
    return (
      <div className="bg-[#FFF7F0] rounded-3xl border border-[#FFD7D0] shadow-md p-6 max-w-md mx-auto mt-8 flex flex-col items-center">
        <div className="bg-[#F26158] rounded-full w-16 h-16 flex items-center justify-center mb-4">
          <span className="text-4xl text-white">✅</span>
        </div>
        <div className="font-bold text-lg text-[#F26158] mb-2">Your appointment is booked!</div>
        <div className="text-[#4B2221] text-center mb-4">We’ve sent you a confirmation email.</div>
        <Button className="bg-[#F26158] text-white rounded-full px-6 py-2" onClick={onComplete}>
          Back to Home
        </Button>
      </div>
    );
  }

  return null;
}
