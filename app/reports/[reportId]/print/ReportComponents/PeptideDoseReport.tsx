// import { ReportPage } from "@/components/medical-reports/ReportPage";
// import {
//   Activity,
//   CalendarDays,
//   ClipboardCheck,
//   HeartPulse,
//   Info,
//   Pill,
//   Scale,
//   ShieldCheck,
//   Target,
// } from "lucide-react";
// import type { ReactNode } from "react";

// export interface PeptideDoseTreatment {
//   id: string;
//   category: string;
//   commercialName: string;
//   activeIngredient: string;
//   primaryIndication: string;
//   administration: string;
//   administrationDisplay: string;
//   approvedStartingDose: string;
//   approvedTitrationSteps: string;
//   maximumApprovedDose: string;
//   frequency: string;
//   frequencyDisplay: string;
//   notes: string;
// }

// export interface PeptideDoseRecommendation {
//   treatment: PeptideDoseTreatment;
//   recommendedMaximumDose: number;
//   recommendedMaximumDoseUnit: string;
// }

// export interface PeptideDoseProps {
//   recommendations: PeptideDoseRecommendation[];
//   className?: string;
// }

// const PRODUCT_TONES: Record<
//   string,
//   { primary: string; dark: string; light: string }
// > = {
//   semaglutide: { primary: "#007082", dark: "#005460", light: "#e2f5f5" },
//   tirzepatide: { primary: "#67209b", dark: "#47116f", light: "#f1e7fb" },
//   liraglutide: { primary: "#0646b6", dark: "#022d84", light: "#e5edff" },
//   "olive-oil-moringa": {
//     primary: "#287c18",
//     dark: "#155a09",
//     light: "#e8f5df",
//   },
// };

// function getTone(id: string) {
//   return (
//     PRODUCT_TONES[id] ?? {
//       primary: "#0b3d91",
//       dark: "#07245b",
//       light: "#e7eefc",
//     }
//   );
// }

// function formatDose(value: number, unit: string) {
//   return Number.isFinite(value) ? `${value.toFixed(2)} ${unit}` : `— ${unit}`;
// }

// function medicineName(recommendation: PeptideDoseRecommendation) {
//   return recommendation.treatment.activeIngredient.toUpperCase();
// }

// export default function PeptideDoseReport({
//   recommendations,
//   className = "",
// }: PeptideDoseProps) {
//   const peptideRecommendations = recommendations.filter(
//     (item) => item.treatment.category === "peptide",
//   );
//   const supplementRecommendations = recommendations.filter(
//     (item) => item.treatment.category !== "peptide",
//   );

//   return (
//     <ReportPage>
//       <section
//         aria-label="Proposed peptides medical use report"
//         className={`m-auto w-[1100px] min-w-[1100px] overflow-hidden bg-white px-7 py-8 font-sans text-[#061c79] ${className}`}
//       >
//         <header className="text-center">
//           <h1 className="text-[34px] font-black uppercase leading-none tracking-[-0.035em]">
//             Proposed Peptides – Medical Use
//           </h1>
//           <p className="mt-1 text-[13px] font-bold italic leading-none">
//             Clinically Approved Peptides for Metabolic Health, Weight Management
//             &amp; Therapeutic Support
//           </p>
//           <div className="mx-auto mt-4 flex w-[680px] items-center justify-center gap-4 rounded-[10px] border border-[#1647cb] py-1.5">
//             <ShieldCheck className="h-9 w-9 text-[#087225]" strokeWidth={2.3} />
//             <div className="text-center">
//               <p className="text-[16px] font-black leading-none">
//                 ALL PEPTIDES ARE{" "}
//                 <span className="text-[#087225]">FDA-APPROVED</span> FOR HUMAN
//                 USE
//               </p>
//               <p className="mt-1 text-[11px] font-semibold">
//                 May be prescribed by licensed healthcare professionals for
//                 specific medical conditions.
//               </p>
//             </div>
//           </div>
//         </header>

//         <div className="mt-2 grid grid-cols-[240px_1fr_240px] items-center gap-5">
//           <Applications />
//           <div className="flex h-[290px] items-end justify-center gap-4">
//             {peptideRecommendations.slice(0, 3).map((recommendation) => (
//               <MedicineVial
//                 key={recommendation.treatment.id}
//                 recommendation={recommendation}
//               />
//             ))}
//           </div>
//           <Benefits />
//         </div>

//         <h2 className="mt-3 text-center text-[18px] font-black leading-none">
//           CALCULATED DOSAGE ( ADULT PROTOCOL )
//         </h2>
//         <div className="mt-1 overflow-hidden rounded-[8px] border border-[#2c51ba]">
//           <table className="w-full table-fixed border-collapse text-center">
//             <thead className="text-[13px] font-black uppercase text-white">
//               <tr>
//                 <TableHeader className="bg-[#071d73]">Peptide</TableHeader>
//                 <TableHeader className="bg-[#006977]">
//                   Starting Dose
//                 </TableHeader>
//                 <TableHeader className="bg-[#075367]">
//                   Titration Guideline
//                 </TableHeader>
//                 <TableHeader className="bg-[#10217c]">
//                   Maintenance Dose
//                 </TableHeader>
//                 <TableHeader className="bg-[#4b1478]">Frequency</TableHeader>
//                 <TableHeader className="bg-[#137029]">
//                   Recommended Dose
//                 </TableHeader>
//               </tr>
//             </thead>
//             <tbody>
//               {recommendations.map((recommendation) => (
//                 <DoseRow
//                   key={recommendation.treatment.id}
//                   recommendation={recommendation}
//                 />
//               ))}
//             </tbody>
//           </table>
//         </div>

//         {supplementRecommendations.length > 0 && (
//           <div className="mt-2 flex items-center justify-center gap-3 rounded-[8px] border border-[#2c8420] bg-[#f5fff1] px-5 py-1.5 text-center">
//             <Pill className="h-7 w-7 text-[#247b17]" />
//             <p className="text-[12px] font-semibold">
//               <strong className="uppercase text-[#17650c]">
//                 Nutritional supplement recommendation:
//               </strong>{" "}
//               {supplementRecommendations
//                 .map(
//                   (item) =>
//                     `${item.treatment.commercialName} — ${formatDose(item.recommendedMaximumDose, item.recommendedMaximumDoseUnit)} ${item.treatment.frequencyDisplay.toLowerCase()}`,
//                 )
//                 .join(" | ")}
//             </p>
//           </div>
//         )}

//         <div className="mt-2 grid grid-cols-5 overflow-hidden rounded-[8px] border border-[#c4c9ea]">
//           <ProtocolPoint
//             icon={ClipboardCheck}
//             tone="#007082"
//             title="PRESCRIPTION ONLY"
//             text="Use under the supervision of a licensed healthcare professional."
//           />
//           <ProtocolPoint
//             icon={ShieldCheck}
//             tone="#4c167f"
//             title="CLINICALLY APPROVED"
//             text="All three peptides are FDA-approved for human medical treatment."
//           />
//           <ProtocolPoint
//             icon={Target}
//             tone="#07508e"
//             title="INDIVIDUALIZED TREATMENT"
//             text="Dosages should be personalized based on patient condition, goals and clinical response."
//           />
//           <ProtocolPoint
//             icon={Activity}
//             tone="#19751b"
//             title="MONITORING REQUIRED"
//             text="Regular follow-up ensures safety, effectiveness and optimal therapeutic outcomes."
//           />
//           <ProtocolPoint
//             icon={CalendarDays}
//             tone="#4c167f"
//             title="CONSISTENCY IS KEY"
//             text="Adherence to the protocol is essential for achieving desired results."
//             last
//           />
//         </div>

//         <footer className="mt-2 flex items-center gap-3 rounded-[8px] border border-[#ed1d24] px-4 py-1.5">
//           <Info
//             className="h-10 w-10 shrink-0 text-[#ed1d24]"
//             strokeWidth={2.5}
//           />
//           <p className="text-[12px] font-semibold leading-snug text-[#ed1d24]">
//             These peptides are FDA-approved for human use and may be prescribed
//             by licensed healthcare professionals for specific medical
//             conditions.
//             <br />
//             <strong>Use under medical supervision.</strong> Dosages may vary
//             based on individual health status and treatment goals.
//           </p>
//         </footer>
//       </section>
//     </ReportPage>
//   );
// }

// function MedicineVial({
//   recommendation,
// }: {
//   recommendation: PeptideDoseRecommendation;
// }) {
//   const { treatment } = recommendation;
//   const tone = getTone(treatment.id);
//   return (
//     <div className="flex w-[150px] flex-col items-center">
//       <div className="relative w-[136px] pt-8">
//         <div
//           className="absolute left-0 top-0 h-[43px] w-full rounded-[9px] border-b-[5px] border-[#68727d] shadow-[0_5px_8px_rgba(28,35,50,.35)]"
//           style={{
//             background: `linear-gradient(90deg,${tone.dark} 0%,${tone.primary} 19%,#f7fbff 48%,${tone.primary} 75%,${tone.dark} 100%)`,
//           }}
//         />
//         <div className="absolute left-1.5 top-[32px] h-[30px] w-[124px] rounded-b-[7px] border-x border-b border-[#69727d] bg-[linear-gradient(90deg,#374250,#dae0e7_17%,#fff_36%,#53606d_52%,#fff_67%,#dce2e8_84%,#3b4653)] shadow-[0_3px_4px_rgba(30,35,45,.25)]" />
//         <div className="relative mt-[36px] min-h-[202px] overflow-hidden rounded-b-[23px] border-x border-b border-[#8c98a4] bg-[linear-gradient(90deg,#aeb8c1_0%,#e6edf2_10%,#fff_29%,#edf2f5_54%,#fff_74%,#c4ced6_100%)] px-2 pt-9 text-center shadow-[inset_8px_0_10px_rgba(71,85,100,.18),inset_-7px_0_10px_rgba(72,84,97,.16),0_6px_8px_rgba(41,52,67,.18)] before:absolute before:left-[20%] before:top-0 before:h-full before:w-[16%] before:bg-white/35 before:blur-[3px] before:content-[''] after:absolute after:bottom-1 after:left-[10%] after:h-3 after:w-[80%] after:rounded-[50%] after:bg-[#33404e]/30 after:blur-sm after:content-['']">
//           <div className="relative z-10">
//             <p
//               className="text-[15px] font-black leading-none"
//               style={{ color: tone.dark }}
//             >
//               {medicineName(recommendation)}
//             </p>
//             <p
//               className="mt-2 text-[8px] font-black uppercase"
//               style={{ color: tone.primary }}
//             >
//               {treatment.primaryIndication}
//             </p>
//             <p className="mt-3 text-[9px] font-semibold leading-snug">
//               {treatment.administrationDisplay}
//               <br />
//               {treatment.frequencyDisplay}
//             </p>
//             <div
//               className="mx-auto mt-4 rounded-[4px] px-2 py-1 text-[12px] font-black text-white shadow-sm"
//               style={{ backgroundColor: tone.primary }}
//             >
//               {treatment.maximumApprovedDose}
//             </div>
//             <p
//               className="mt-2 text-[9px] font-black"
//               style={{ color: tone.primary }}
//             >
//               Multiple Dose Vial
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// function Applications() {
//   return (
//     <SideCard
//       title="THERAPEUTIC APPLICATIONS"
//       items={[
//         {
//           icon: Scale,
//           tone: "#177719",
//           title: "WEIGHT MANAGEMENT",
//           text: "Supports clinically significant weight loss and maintenance.",
//         },
//         {
//           icon: Activity,
//           tone: "#0646b6",
//           title: "METABOLIC HEALTH",
//           text: "Improves glycemic control, insulin sensitivity and cardiometabolic parameters.",
//         },
//         {
//           icon: HeartPulse,
//           tone: "#60209a",
//           title: "CARDIOVASCULAR SUPPORT",
//           text: "Reduces risk factors associated with cardiovascular disease.",
//         },
//       ]}
//     />
//   );
// }
// function Benefits() {
//   return (
//     <SideCard
//       title="THERAPEUTIC BENEFITS"
//       items={[
//         {
//           icon: Scale,
//           tone: "#007082",
//           title: "PROMOTES WEIGHT LOSS",
//           text: "Reduces appetite and caloric intake.",
//         },
//         {
//           icon: Activity,
//           tone: "#0646b6",
//           title: "IMPROVES BLOOD SUGAR CONTROL",
//           text: "Enhances insulin secretion and reduces glucose levels.",
//         },
//         {
//           icon: HeartPulse,
//           tone: "#60209a",
//           title: "SUPPORTS HEART HEALTH",
//           text: "Reduces cardiovascular risk factors.",
//         },
//         {
//           icon: Activity,
//           tone: "#19751b",
//           title: "ENHANCES QUALITY OF LIFE",
//           text: "Improves energy, mobility and overall well-being.",
//         },
//       ]}
//     />
//   );
// }
// function SideCard({
//   title,
//   items,
// }: {
//   title: string;
//   items: { icon: typeof Activity; tone: string; title: string; text: string }[];
// }) {
//   return (
//     <aside className="rounded-[9px] border border-[#2c51ba] px-4 py-2">
//       <h2 className="text-center text-[15px] font-black">{title}</h2>
//       {items.map(({ icon: Icon, tone, title: itemTitle, text }, index) => (
//         <div
//           key={itemTitle}
//           className={`flex gap-3 py-2 ${index ? "border-t border-[#7690dd]" : ""}`}
//         >
//           <span
//             className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white"
//             style={{ backgroundColor: tone }}
//           >
//             <Icon className="h-5 w-5" />
//           </span>
//           <div>
//             <p className="text-[10px] font-black" style={{ color: tone }}>
//               {itemTitle}
//             </p>
//             <p className="text-[11px] font-semibold leading-snug">{text}</p>
//           </div>
//         </div>
//       ))}
//     </aside>
//   );
// }
// function TableHeader({
//   className,
//   children,
// }: {
//   className: string;
//   children: ReactNode;
// }) {
//   return (
//     <th
//       className={`border-r border-[#9aa8e1] px-2 py-1.5 last:border-r-0 ${className}`}
//     >
//       {children}
//     </th>
//   );
// }
// function DoseRow({
//   recommendation,
// }: {
//   recommendation: PeptideDoseRecommendation;
// }) {
//   const { treatment } = recommendation;
//   const tone = getTone(treatment.id);
//   return (
//     <tr className="border-t border-[#8b9dde] text-[12px] font-semibold">
//       <td
//         className="border-r border-[#8b9dde] px-2 py-2 text-[11px] font-black"
//         style={{ color: tone.primary }}
//       >
//         {medicineName(recommendation)}
//       </td>
//       <td className="border-r border-[#8b9dde] px-2 py-1">
//         <strong className="text-[13px]" style={{ color: tone.primary }}>
//           {treatment.approvedStartingDose}
//         </strong>
//         <br />
//         <span className="text-[10px]">Start low to improve tolerance</span>
//       </td>
//       <td className="border-r border-[#8b9dde] px-2 py-1 text-[11px]">
//         {treatment.approvedTitrationSteps}
//       </td>
//       <td className="border-r border-[#8b9dde] px-2 py-1">
//         <strong className="text-[13px]" style={{ color: tone.primary }}>
//           {treatment.maximumApprovedDose}
//         </strong>
//         <br />
//         <span className="text-[10px]">Maximum approved dose</span>
//       </td>
//       <td className="border-r border-[#8b9dde] px-2 py-1">
//         {treatment.frequencyDisplay}
//       </td>
//       <td className="px-2 py-1">
//         <strong className="text-[13px]" style={{ color: tone.primary }}>
//           {formatDose(
//             recommendation.recommendedMaximumDose,
//             recommendation.recommendedMaximumDoseUnit,
//           )}
//         </strong>
//         <br />
//         <span className="text-[10px]">recommended maximum</span>
//       </td>
//     </tr>
//   );
// }
// function ProtocolPoint({
//   icon: Icon,
//   tone,
//   title,
//   text,
//   last = false,
// }: {
//   icon: typeof Activity;
//   tone: string;
//   title: string;
//   text: string;
//   last?: boolean;
// }) {
//   return (
//     <div
//       className={`flex min-h-[76px] items-center gap-2 px-3 py-2 ${last ? "" : "border-r border-dashed border-[#9da9df]"}`}
//     >
//       <span
//         className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white"
//         style={{ backgroundColor: tone }}
//       >
//         <Icon className="h-6 w-6" />
//       </span>
//       <div>
//         <p className="text-[10px] font-black" style={{ color: tone }}>
//           {title}
//         </p>
//         <p className="text-[9px] font-semibold leading-snug">{text}</p>
//       </div>
//     </div>
//   );
// }
import { ReportPage } from "@/components/medical-reports/ReportPage";
import {
  Brain,
  CircleDot,
  Dna,
  HeartHandshake,
  HeartPulse,
  Microscope,
  Network,
  ShieldCheck,
  Syringe,
  UserRound,
} from "lucide-react";
import Image from "next/image";

export interface PeptideDoseTreatment {
  id: string;
  group: string;
  therapy: string;
  activeIngredient: string;
  indication: string;
  labeledDoseRegimen: string;
  maximumOrMaintenance: string;
}
export interface PeptideDoseRecommendation {
  treatment: PeptideDoseTreatment;
  recommendedDose: number;
  unit: string;
}
export interface PeptideDoseProps {
  /** IFI Range (0–25) used by the proof-of-concept model. */ ifiRange: number;
  recommendations: PeptideDoseRecommendation[];
  className?: string;
}

const TONES: Record<string, { primary: string; dark: string; pale: string }> = {
  copaxone: { primary: "#073ee4", dark: "#062b9c", pale: "#edf2ff" },
  wegovy: { primary: "#007b7d", dark: "#005657", pale: "#e5f7f6" },
  lutathera: { primary: "#5a1195", dark: "#3c0769", pale: "#f4ebff" },
  saxenda: { primary: "#fc3916", dark: "#c6200b", pale: "#fff0ec" },
  gattex: { primary: "#087390", dark: "#04566d", pale: "#e7f6fb" },
};
function toneFor(id: string) {
  return TONES[id] ?? { primary: "#073a9f", dark: "#061f65", pale: "#edf2ff" };
}
function formatDose(value: number, unit: string) {
  return Number.isFinite(value)
    ? `${value.toFixed(unit === "GBq" ? 2 : 1)} ${unit}`
    : `— ${unit}`;
}
function shortIngredient(value: string) {
  return value.split("/")[0]?.trim() || value;
}
function groupIcon(group: string, color: string) {
  const props = { className: "h-5 w-5", style: { color }, strokeWidth: 2.2 };
  if (group === "Neurological") return <Brain {...props} />;
  if (group === "Cardiovascular") return <HeartPulse {...props} />;
  if (group === "Oncological") return <CircleDot {...props} />;
  if (group === "Endocrine-Metabolic") return <Network {...props} />;
  return <Dna {...props} />;
}
function frequencyFrom(regimen: string) {
  const text = regimen.toLowerCase();
  if (text.includes("three times weekly")) return "3× weekly";
  if (text.includes("once weekly")) return "Weekly";
  if (text.includes("daily")) return "Daily";
  if (text.includes("every 8 weeks")) return "Every 8 weeks";
  return "Per labeled regimen";
}
function administrationFrom(regimen: string) {
  const text = regimen.toLowerCase();
  if (text.includes(" iv")) return "Intravenous (IV)";
  if (text.includes("sc") || text.includes("subcutaneous"))
    return "Subcutaneous (SC)";
  return "Per labeled regimen";
}

export default function PeptideDose({
  ifiRange,
  recommendations,
  className = "",
}: PeptideDoseProps) {
  const range = Math.min(
    25,
    Math.max(0, Number.isFinite(ifiRange) ? ifiRange : 0),
  );
  return (
    <ReportPage>
      <section
        aria-label="Five FDA-approved peptide proof-of-concept report"
        className={`mx-auto w-[1100px] min-w-[1100px] overflow-hidden  bg-white px-[4mm] py-[3mm] font-sans text-[#071d74] mt-3 ${className}`}
      >
        <header className="relative flex h-[57mm] items-start justify-between pt-[1mm]">
          <div className="w-[43mm] rounded-[8px] border border-[#5270d3] py-[2mm] text-center">
            <p className="text-[17px] font-black leading-none">IFI RANGE</p>
            <div className="mx-[5mm] mt-[2mm] rounded-[4px] bg-[linear-gradient(90deg,#c27500,#f0ad21,#bf7100)] py-[1mm] text-[35px] font-black leading-none text-white">
              {range}
            </div>
            <p className="mt-[1mm] text-[13px] font-black leading-none">
              (PREDISPOSITION)
            </p>
          </div>
          <div className="absolute left-1/2 top-0 w-[155mm] -translate-x-1/2 text-center">
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
            <h1 className="mt-[1mm] text-[34px] font-black leading-none tracking-[.03em]">
              5 FDA-APPROVED PEPTIDES
            </h1>
            <p className="mt-[1mm] text-[13px] font-bold tracking-[.24em] text-[#d56e00]">
              PERSONALIZED HEALTH. SCIENCE-BASED CARE.
            </p>
          </div>
          <div className="w-[52mm] rounded-[8px] border border-[#5270d3] px-[2mm] py-[2mm] text-center">
            <p className="text-[16px] font-black leading-none">
              POC (PROOF OF CONCEPT)
            </p>
            <p className="mt-[1mm] text-[11px] font-semibold leading-snug">
              IFI (0–25) is used to personalize the dose within the FDA-approved
              range.
            </p>
            <p className="mt-[1mm] text-[11px] font-semibold">
              Model rule: Dose = (IFI / 25) × Max Dose
            </p>
            <p className="mt-[2mm] text-[11px] font-semibold italic leading-snug">
              This is an experimental model. Not an FDA-approved dosing regimen.
            </p>
          </div>
        </header>
        <div className="grid h-[145mm] mt-6 grid-cols-5 gap-[2mm]">
          {recommendations.slice(0, 5).map((item) => (
            <TherapyCard
              key={item.treatment.id}
              recommendation={item}
              ifiRange={range}
            />
          ))}
        </div>
        <div className="mt-[10mm] overflow-hidden rounded-[7px] border border-[#4863c6]">
          <table className="w-full table-fixed border-collapse text-center">
            <thead>
              <tr className="bg-[#061d75] text-[10px] font-black uppercase leading-none text-white">
                <th className="w-[12%] border-r border-[#7f93de] py-[1.5mm]">
                  Area of Focus
                </th>
                <th className="w-[14%] border-r border-[#7f93de]">
                  Peptide (Brand)
                </th>
                <th className="w-[13%] border-r border-[#7f93de]">
                  Dosing Frequency
                  <br />
                  (POC Model)
                </th>
                <th className="w-[14%] border-r border-[#7f93de]">
                  POC Dose for IFI {range}
                </th>
                <th className="w-[8%] border-r border-[#7f93de]">Units</th>
                <th className="w-[15%] border-r border-[#7f93de]">
                  Administration
                  <br />
                  (POC Model)
                </th>
                <th className="w-[12%] border-r border-[#7f93de]">
                  Max Reference
                  <br />
                  (IFI 25)
                </th>
                <th className="w-[12%]">Notes (POC Model Formula)</th>
              </tr>
            </thead>
            <tbody>
              {recommendations.slice(0, 5).map((item) => (
                <TableRow
                  key={item.treatment.id}
                  recommendation={item}
                  ifiRange={range}
                />
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-[2mm] grid grid-cols-[1.25fr_1fr_1.25fr] items-center gap-[4mm] text-[9px] font-semibold leading-snug">
          <div className="flex min-h-[20mm] items-center gap-2 rounded-[7px] border border-[#9caee6] px-[3mm]">
            <ShieldCheck className="h-7 w-7 shrink-0 text-[#0b2b81]" />
            <p>
              This table represents an experimental IFI-based POC dosing model.
              <br />
              Actual prescribing must follow the official FDA Prescribing
              Information for each product.
            </p>
          </div>
          <div className="min-h-[20mm] rounded-[7px] border border-[#9caee6] px-[3mm] py-[2mm]">
            • FDA-approved typical regimen for adults:
            <br />• Follow treatment-specific prescribing information.
            <br />• The POC model uses IFI as a reference scale only.
          </div>
          <div className="flex items-center justify-between text-[12px] font-black">
            <ValueMark icon={Microscope} color="#2634bd" label="SCIENCE" />
            <ValueMark icon={ShieldCheck} color="#218531" label="EVIDENCE" />
            <ValueMark icon={HeartHandshake} color="#6621a1" label="CARE" />
            <ValueMark icon={UserRound} color="#1471b8" label="LONGEVITY" />
          </div>
        </div>
      </section>
    </ReportPage>
  );
}

function TherapyCard({
  recommendation,
  ifiRange,
}: {
  recommendation: PeptideDoseRecommendation;
  ifiRange: number;
}) {
  const { treatment } = recommendation;
  const tone = toneFor(treatment.id);
  return (
    <article className="flex min-w-0 flex-col rounded-[8px] border border-[#f5ccb2] px-[17px] py-[17px]">
      <div className="flex h-[5mm] items-start gap-2">
        <span className="shrink-0">
          {groupIcon(treatment.group, tone.primary)}
        </span>
        <p
          className="text-[13px] font-black leading-none"
          style={{ color: tone.dark }}
        >
          {treatment.group.toUpperCase()}
        </p>
      </div>
      <Vial recommendation={recommendation} />
      <div className="mt-[8mm] text-center">
        <p
          className="text-[13px] font-black leading-none"
          style={{ color: tone.primary }}
        >
          {treatment.therapy.toUpperCase()}
        </p>
        <p className="mt-[1mm] text-[9px] font-bold leading-none">
          ({shortIngredient(treatment.activeIngredient)})
        </p>
      </div>
      <div
        className="mt-[2mm] min-h-[18mm] rounded-[6px] border px-[2mm] py-[2mm] text-center"
        style={{ backgroundColor: tone.pale, borderColor: `${tone.primary}33` }}
      >
        <p className="text-[10px] font-black" style={{ color: tone.primary }}>
          Indication:
        </p>
        <p className="mt-[1mm] text-[9px] font-semibold leading-snug">
          {treatment.indication}
        </p>
      </div>
      <div
        className="mt-[2mm] rounded-[6px] border border-[#d3defb]"
        style={{ backgroundColor: tone.pale }}
      >
        <p
          className="rounded-t-[5px] py-[1mm] text-center text-[11px] font-black leading-none text-white"
          style={{ backgroundColor: tone.dark }}
        >
          POC DOSE FOR IFI {ifiRange}
        </p>
        <div className="relative px-[2mm] py-[2mm] text-center">
          <p
            className="text-[23px] font-black leading-none"
            style={{ color: tone.dark }}
          >
            {formatDose(recommendation.recommendedDose, recommendation.unit)}
          </p>
          <p className="mt-[1mm] text-[9px] font-semibold">
            {administrationFrom(treatment.labeledDoseRegimen)}
          </p>
          <p className="mt-[1mm] text-[8px] font-black">
            (IFI-based POC equivalent)
          </p>
          <Syringe
            className="absolute bottom-[2mm] right-[2mm] h-6 w-6 opacity-70"
            style={{ color: tone.primary }}
          />
        </div>
      </div>
      <p className="mt-[2mm] text-center text-[8px] font-semibold leading-snug">
        <strong>Max reference (IFI 25) = </strong>
        {treatment.maximumOrMaintenance}
      </p>
    </article>
  );
}
// function Vial({
//   recommendation,
// }: {
//   recommendation: PeptideDoseRecommendation;
// }) {
//   const { treatment } = recommendation;
//   const tone = toneFor(treatment.id);
//   return (
//     <div className="mx-auto h-[53mm] w-[29mm] pt-[8mm]">
//       <div className="relative">
//         <div
//           className="absolute left-0 top-0 h-[10mm] w-full rounded-[3mm] border-b-[2mm] border-[#59616a] shadow-[0_1mm_2mm_rgba(0,0,0,.35)]"
//           style={{
//             background: `linear-gradient(90deg,${tone.dark},${tone.primary},#fbfdff,${tone.primary},${tone.dark})`,
//           }}
//         />
//         <div className="absolute left-[2mm] top-[8mm] h-[6mm] w-[25mm] rounded-b-[2mm] border-x border-b border-[#77818d] bg-[linear-gradient(90deg,#3f4953,#e8edf0_22%,#fff_50%,#4b5661_70%,#f2f4f5)]" />
//         <div className="relative top-[13mm] min-h-[36mm] overflow-hidden rounded-b-[5mm] border-x border-b border-[#a6afb8] bg-[linear-gradient(90deg,#aeb8c1,#edf2f5_17%,#fff_36%,#eef2f5_60%,#fff_78%,#b2bbc4)] px-[2mm] pt-[7mm] text-center shadow-[inset_2mm_0_2mm_rgba(62,76,92,.15),inset_-2mm_0_2mm_rgba(62,76,92,.14),0_2mm_2mm_rgba(56,66,78,.18)] before:absolute before:left-[20%] before:top-0 before:h-full before:w-[14%] before:bg-white/40 before:blur-sm before:content-[''] after:absolute after:bottom-[1mm] after:left-[12%] after:h-[2mm] after:w-[76%] after:rounded-[50%] after:bg-slate-700/25 after:blur-sm after:content-['']">
//           <div className="relative z-10">
//             <p
//               className="text-[13px] font-black leading-none"
//               style={{ color: tone.dark }}
//             >
//               {treatment.therapy.toUpperCase()}
//             </p>
//             <p className="mt-[1mm] text-[9px] font-bold leading-none">
//               {shortIngredient(treatment.activeIngredient)}
//             </p>
//             <p className="mt-[2mm] text-[9px] font-semibold">Injection</p>
//             <p
//               className="mt-[1mm] text-[11px] font-black"
//               style={{ color: tone.primary }}
//             >
//               {formatDose(recommendation.recommendedDose, recommendation.unit)}
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

function Vial({
  recommendation,
}: {
  recommendation: PeptideDoseRecommendation;
}) {
  const { treatment } = recommendation;
  const tone = toneFor(treatment.id);
  return (
    <div className="mx-auto h-[53mm] w-[29mm] pt-[8mm]">
      <div className="relative ml-[-37px] w-[170px] h-[170px]">
        <Image
          src={`/${treatment.id}.jpg`}
          fill
          loading="eager"
          alt={`${treatment.id} Image`}
          quality={100}
          className="object-contain"
        />
      </div>
    </div>
  );
}
function TableRow({
  recommendation,
  ifiRange,
}: {
  recommendation: PeptideDoseRecommendation;
  ifiRange: number;
}) {
  const { treatment } = recommendation;
  const tone = toneFor(treatment.id);
  return (
    <tr className="border-t border-[#b7c7f0] text-[9px] font-semibold leading-tight">
      <td className="border-r border-[#d0d9f3] px-1 py-[1.4mm]">
        <span
          className="inline-flex items-center gap-1"
          style={{ color: tone.primary }}
        >
          {groupIcon(treatment.group, tone.primary)}
          <span>{treatment.group}</span>
        </span>
      </td>
      <td className="border-r border-[#d0d9f3] px-1 py-[1.4mm]">
        <strong style={{ color: tone.dark }}>
          {treatment.therapy.toUpperCase()}
        </strong>
        <br />
        <span>({shortIngredient(treatment.activeIngredient)})</span>
      </td>
      <td className="border-r border-[#d0d9f3] px-1">
        {frequencyFrom(treatment.labeledDoseRegimen)}
      </td>
      <td
        className="border-r border-[#d0d9f3] px-1 text-[13px] font-black"
        style={{ color: tone.dark }}
      >
        {formatDose(recommendation.recommendedDose, recommendation.unit)}
      </td>
      <td className="border-r border-[#d0d9f3] px-1">{recommendation.unit}</td>
      <td className="border-r border-[#d0d9f3] px-1">
        {administrationFrom(treatment.labeledDoseRegimen)}
      </td>
      <td className="border-r border-[#d0d9f3] px-1">
        {treatment.maximumOrMaintenance}
      </td>
      <td className="px-1">
        Dose = (IFI / 25) × reference
        <br />
        {ifiRange} / 25 × reference
      </td>
    </tr>
  );
}
function ValueMark({
  icon: Icon,
  color,
  label,
}: {
  icon: typeof Microscope;
  color: string;
  label: string;
}) {
  return (
    <span className="flex items-center gap-1" style={{ color }}>
      <span
        className="flex h-8 w-8 items-center justify-center rounded-full border-2"
        style={{ borderColor: color }}
      >
        <Icon className="h-5 w-5" />
      </span>
      {label}
    </span>
  );
}
