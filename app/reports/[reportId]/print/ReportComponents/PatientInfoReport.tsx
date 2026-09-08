import { CalendarDays, Mars, UserRound, Venus } from "lucide-react";
import Image from "next/image";

export interface AgingCoefficientPatientInfoProps {
  patientName: string;
  dateOfBirth: string;
  sex: "male" | "female";
  /** Optional report date, for example the evaluation date. */
  evaluationDate?: string;
  className?: string;
}

function formatSex(sex: AgingCoefficientPatientInfoProps["sex"]) {
  return sex === "female" ? "Female" : "Male";
}

/**
 * Fixed-width patient summary for use directly below the Aging Coefficient
 * title. It deliberately does not calculate or alter clinical values.
 */
export default function PatientInfoReport({
  patientName,
  dateOfBirth,
  sex,
  evaluationDate,
  className = "",
}: AgingCoefficientPatientInfoProps) {
  const isFemale = sex === "female";

  return (
    <div className="text-center mt-13">
      <div className="flex items-center justify-center gap-2 mb-3">
        <Image
          src="/Logo.jpg"
          width={270}
          height={100}
          quality={100}
          loading="eager"
          alt="MYTime Logo"
        />
      </div>

      <div
        aria-label="Patient information"
        className={`mx-auto flex w-[1000px] min-w-[1000px] items-stretch overflow-hidden rounded-[9px] border border-[#3248b0] bg-white font-sans text-[#071d68] ${className}`}
      >
        <PatientDetail
          icon={UserRound}
          label="PATIENT NAME"
          value={patientName || "—"}
          tone="#7235a5"
        />
        <PatientDetail
          icon={isFemale ? Venus : Mars}
          label="SEX"
          value={formatSex(sex)}
          tone={isFemale ? "#7235a5" : "#075ec7"}
        />
        <PatientDetail
          icon={CalendarDays}
          label="DATE OF BIRTH"
          value={dateOfBirth || "—"}
          tone="#075ec7"
        />
        {evaluationDate ? (
          <PatientDetail
            icon={CalendarDays}
            label="EVALUATION DATE"
            value={evaluationDate}
            tone="#7235a5"
            last
          />
        ) : null}
      </div>
    </div>
  );
}

function PatientDetail({
  icon: Icon,
  label,
  value,
  tone,
  last = false,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
  tone: string;
  last?: boolean;
}) {
  return (
    <div
      className={`flex min-w-0 flex-1 items-center gap-2 px-4 py-2 ${last ? "" : "border-r border-[#c4cbe8]"}`}
    >
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white"
        style={{ backgroundColor: tone }}
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={2.4} />
      </span>
      <div className="min-w-0">
        <p
          className="text-[9px] font-black leading-none"
          style={{ color: tone }}
        >
          {label}
        </p>
        <p className="mt-1 truncate text-[13px] font-bold leading-none">
          {value}
        </p>
      </div>
    </div>
  );
}
