// import { ReportPage } from "@/components/medical-reports/ReportPage";
// import type { IFIFunctionalProfile } from "@/types/ifi-functional-profile";

// type PatientSex = "male" | "female" | "all";

// interface IFIFunctionalConditionReportProps {
//   patientName: string;
//   age: number;
//   sex: PatientSex;

//   /**
//    * Complete record returned by:
//    * getIFIFunctionalProfile(...)
//    */
//   profile: IFIFunctionalProfile;

//   /**
//    * Optional patient mannequin/image.
//    *
//    * Example later:
//    * "/images/reports/male-mannequin.png"
//    * "/images/reports/female-mannequin.png"
//    *
//    * The report still renders correctly when omitted.
//    */
//   patientFigureSrc?: string;
// }

// interface RiskTheme {
//   background: string;
//   border: string;
//   label: string;
//   value: string;
//   specialistBackground?: string;
//   specialistBorder?: string;
//   specialistColor?: string;
// }

// function getRiskTheme(riskLabel: string, ifiRange: number): RiskTheme {
//   /*
//    * IFI 0 is the shared NORMAL profile.
//    */
//   if (ifiRange === 0 || riskLabel.toUpperCase() === "NORMAL") {
//     return {
//       background: "#f4fff7",
//       border: "#9fd0ae",
//       label: "#236a3b",
//       value: "#0f8a40",

//       specialistBackground: "#f5fff8",
//       specialistBorder: "#9fd0ae",
//       specialistColor: "#08783a",
//     };
//   }

//   const normalized = riskLabel.toUpperCase();

//   /*
//    * LOW RISK
//    *
//    * Matches the green treatment used in the supplied
//    * low-risk HTML files.
//    */
//   if (normalized.includes("LOW RISK")) {
//     return {
//       background: "#f5fff7",
//       border: "#abd5b6",
//       label: "#16713b",
//       value: "#168645",
//     };
//   }

//   /*
//    * MODERATE RISK
//    *
//    * Matches the amber treatment visible in supplied
//    * moderate-risk Female profiles.
//    */
//   if (normalized.includes("MODERATE RISK")) {
//     return {
//       background: "#fff9ee",
//       border: "#e5c98b",
//       label: "#956200",
//       value: "#d18b00",
//     };
//   }

//   /*
//    * VERY HIGH must be checked before HIGH because
//    * "VERY HIGH RISK" also contains "HIGH RISK".
//    */
//   if (normalized.includes("VERY HIGH RISK")) {
//     return {
//       background: "#fff2f3",
//       border: "#e7a4aa",
//       label: "#9f1724",
//       value: "#b71928",
//     };
//   }

//   if (normalized.includes("HIGH RISK")) {
//     return {
//       background: "#fff6f1",
//       border: "#e9b29b",
//       label: "#a6471e",
//       value: "#cf4d21",
//     };
//   }

//   /*
//    * Defensive fallback.
//    *
//    * This should normally never be reached because the
//    * database contains our known risk labels.
//    */
//   return {
//     background: "#f5fff7",
//     border: "#abd5b6",
//     label: "#16713b",
//     value: "#168645",
//   };
// }

// function formatAge(age: number): string {
//   if (!Number.isFinite(age)) {
//     return "—";
//   }

//   /*
//    * We do not need long decimal ages in the report title.
//    * 60.3 remains 60.3, while 60 becomes 60.
//    */
//   return Number.isInteger(age)
//     ? String(age)
//     : age.toFixed(1).replace(/\.0$/, "");
// }

// export default function IFIFunctionalConditionReport({
//   patientName,
//   age,
//   sex,
//   profile,
//   patientFigureSrc,
// }: IFIFunctionalConditionReportProps) {
//   const isNormal = profile.ifiRange === 0;

//   const riskTheme = getRiskTheme(profile.riskLabel, profile.ifiRange);

//   const displayName = patientName.trim() || "PATIENT";

//   const axisConditions = [
//     {
//       key: "mental-intestinal",
//       label: isNormal ? "GUT–BRAIN AXIS" : "MENTAL–INTESTINAL",
//       value: profile.mentalIntestinal,
//       headerColor: isNormal ? "#0b1d57" : "#14834a",
//     },
//     {
//       key: "endocrine-metabolic",
//       label: "ENDOCRINE–METABOLIC",
//       value: profile.endocrineMetabolic,
//       headerColor: isNormal ? "#0b1d57" : "#0f4fbf",
//     },
//     {
//       key: "tumoral-proliferative",
//       label: "TUMORAL–PROLIFERATIVE",
//       value: profile.tumoralProliferative,
//       headerColor: isNormal ? "#0b1d57" : "#e96a16",
//     },
//     {
//       key: "neurological",
//       label: "NEUROLOGICAL",
//       value: profile.neurological,
//       headerColor: isNormal ? "#0b1d57" : "#6b2caf",
//     },
//     {
//       key: "cardiovascular",
//       label: "CARDIOVASCULAR",
//       value: profile.cardiovascular,
//       headerColor: isNormal ? "#0b1d57" : "#c51f2c",
//     },
//   ] as const;

//   return (
//     <ReportPage>
//       <section
//         style={{
//           /*
//            * IMPORTANT:
//            *
//            * You requested that this report should always remain
//            * 1100px regardless of viewport size.
//            *
//            * No responsive shrinking is applied.
//            */
//           width: "1100px",
//           minWidth: "1100px",
//           maxWidth: "1100px",

//           margin: "0 auto",

//           background: "#ffffff",
//           borderRadius: "20px",

//           padding: isNormal ? "28px 32px 30px" : "28px",

//           boxSizing: "border-box",

//           fontFamily: "Arial, Helvetica, sans-serif",
//           color: isNormal ? "#132043" : "#102052",

//           WebkitPrintColorAdjust: "exact",
//           printColorAdjust: "exact",
//         }}
//       >
//         {/* =====================================================
//           HEADER
//       ====================================================== */}

//         <div
//           style={{
//             display: "grid",
//             gridTemplateColumns: "1fr 250px",
//             gap: isNormal ? "22px" : "20px",
//             alignItems: "stretch",
//           }}
//         >
//           {/* ---------------------------------------------
//             TITLE CARD
//         ---------------------------------------------- */}

//           <div
//             style={{
//               position: "relative",

//               border: "2px solid #bfd0ee",
//               borderRadius: isNormal ? "18px" : "17px",

//               padding: isNormal ? "18px 24px" : "18px",

//               background: isNormal
//                 ? "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)"
//                 : "#fbfdff",

//               minHeight: "132px",

//               display: "flex",
//               flexDirection: "column",
//               justifyContent: "center",

//               overflow: "hidden",
//             }}
//           >
//             {patientFigureSrc && (
//               <Image
//                 src={patientFigureSrc}
//                 alt=""
//                 fill
//                 aria-hidden="true"
//                 style={{
//                   position: "absolute",
//                   left: "12px",
//                   top: "50%",
//                   transform: "translateY(-50%)",

//                   width: "58px",
//                   height: "104px",

//                   objectFit: "cover",
//                   objectPosition: "center top",

//                   opacity: 0.88,
//                   borderRadius: "8px",
//                 }}
//               />
//             )}

//             <h1
//               style={{
//                 margin: 0,

//                 /*
//                  * Extra horizontal room keeps an optional
//                  * mannequin clear of the heading.
//                  */
//                 paddingLeft: patientFigureSrc ? "64px" : 0,
//                 paddingRight: patientFigureSrc ? "20px" : 0,

//                 textAlign: "center",

//                 fontSize: isNormal ? "42px" : "40px",
//                 lineHeight: 1.08,

//                 fontWeight: 700,
//                 color: "#0b1d57",

//                 letterSpacing: isNormal ? "0.6px" : "0",
//               }}
//             >
//               {isNormal
//                 ? "IFI RANGE 0 — FIVE-AXIS FUNCTIONAL PROFILE"
//                 : `${displayName.toUpperCase()} · IFI RANGE ${
//                     profile.ifiRange
//                   } · AGE ${formatAge(age)}`}
//             </h1>

//             <div
//               style={{
//                 marginTop: "8px",

//                 paddingLeft: patientFigureSrc ? "64px" : 0,
//                 paddingRight: patientFigureSrc ? "20px" : 0,

//                 textAlign: "center",

//                 color: "#31538c",

//                 fontSize: "19px",
//                 lineHeight: 1.3,
//                 fontWeight: 700,
//               }}
//             >
//               {profile.subtitle}
//             </div>

//             {isNormal && (
//               <div
//                 style={{
//                   marginTop: "9px",
//                   textAlign: "center",
//                   fontSize: "14px",
//                   fontWeight: 700,
//                   color: "#56698d",
//                 }}
//               >
//                 {displayName.toUpperCase()} · AGE {formatAge(age)} ·{" "}
//                 {sex.toUpperCase()}
//               </div>
//             )}
//           </div>

//           {/* ---------------------------------------------
//             IFI / RISK CARD
//         ---------------------------------------------- */}

//           <div
//             style={{
//               border: `2px solid ${riskTheme.border}`,
//               borderRadius: isNormal ? "18px" : "17px",

//               padding: "18px",

//               background: riskTheme.background,

//               display: "flex",
//               flexDirection: "column",
//               justifyContent: "center",
//               alignItems: "center",

//               textAlign: "center",

//               minHeight: "132px",
//             }}
//           >
//             <div
//               style={{
//                 color: riskTheme.label,

//                 fontSize: isNormal ? "20px" : "17px",
//                 lineHeight: 1.2,

//                 fontWeight: 800,
//               }}
//             >
//               IFI VALUE
//             </div>

//             <div
//               style={{
//                 margin: isNormal ? "6px 0" : "2px 0",

//                 color: riskTheme.value,

//                 fontSize: isNormal ? "72px" : "70px",
//                 lineHeight: 1,

//                 fontWeight: 900,
//               }}
//             >
//               {profile.ifiRange}
//             </div>

//             <div
//               style={{
//                 color: riskTheme.label,

//                 fontSize: isNormal ? "18px" : "14px",
//                 lineHeight: 1.25,

//                 fontWeight: 800,
//               }}
//             >
//               {profile.riskLabel}
//             </div>
//           </div>
//         </div>

//         {/* =====================================================
//           INTRODUCTION
//       ====================================================== */}

//         <div
//           style={{
//             marginTop: isNormal ? "20px" : "18px",

//             padding: isNormal ? "18px 22px" : "17px 20px",

//             border: `1.5px solid ${isNormal ? "#c7d7ef" : "#cad8ed"}`,

//             borderRadius: isNormal ? "16px" : "15px",

//             background: isNormal ? "#fbfdff" : "#ffffff",

//             fontSize: "17px",
//             lineHeight: isNormal ? 1.55 : 1.5,

//             color: isNormal ? "#132043" : "#102052",
//           }}
//         >
//           {profile.intro}
//         </div>

//         {/* =====================================================
//           FIVE-AXIS CONDITIONS TABLE
//       ====================================================== */}

//         <table
//           style={{
//             width: "100%",

//             marginTop: "18px",

//             borderCollapse: "separate",
//             borderSpacing: 0,

//             tableLayout: "fixed",

//             border: isNormal ? "1.5px solid #cbd7ea" : "1px solid #cbd7e9",

//             borderRadius: isNormal ? "16px" : "15px",

//             overflow: "hidden",
//           }}
//         >
//           <thead>
//             <tr>
//               {axisConditions.map((condition) => (
//                 <th
//                   key={condition.key}
//                   style={{
//                     width: "20%",

//                     padding: isNormal ? "14px 10px" : "14px 8px",

//                     background: condition.headerColor,
//                     color: "#ffffff",

//                     fontSize: isNormal ? "15px" : "14px",
//                     lineHeight: 1.25,

//                     fontWeight: 700,
//                     textAlign: "center",
//                     verticalAlign: "middle",
//                   }}
//                 >
//                   {condition.label}
//                 </th>
//               ))}
//             </tr>
//           </thead>

//           <tbody>
//             <tr>
//               {axisConditions.map((condition, index) => (
//                 <td
//                   key={condition.key}
//                   style={{
//                     width: "20%",

//                     padding: isNormal ? "22px 12px" : "22px 10px",

//                     textAlign: "center",
//                     verticalAlign: "middle",

//                     borderTop: isNormal ? "1px solid #dce4f3" : "none",

//                     borderRight:
//                       index === axisConditions.length - 1
//                         ? "none"
//                         : "1px solid #e0e6f0",

//                     color: "#102052",

//                     fontSize: "15px",
//                     lineHeight: 1.35,

//                     fontWeight: 700,

//                     overflowWrap: "break-word",
//                   }}
//                 >
//                   {isNormal ? (
//                     <span
//                       style={{
//                         display: "inline-block",

//                         padding: "8px 14px",

//                         borderRadius: "999px",

//                         background: "#eaf8ef",
//                         color: "#08783a",

//                         fontWeight: 900,
//                       }}
//                     >
//                       {condition.value}
//                     </span>
//                   ) : (
//                     condition.value
//                   )}
//                 </td>
//               ))}
//             </tr>
//           </tbody>
//         </table>

//         {/* =====================================================
//           INTEGRATED INTERPRETATION
//       ====================================================== */}

//         <div
//           style={{
//             marginTop: isNormal ? "20px" : "18px",

//             padding: isNormal ? "18px 22px" : "17px 20px",

//             border: `1.5px solid ${isNormal ? "#c7d7ef" : "#cad8ed"}`,

//             borderRadius: isNormal ? "16px" : "15px",

//             background: isNormal ? "#fbfdff" : "#ffffff",

//             fontSize: "17px",
//             lineHeight: isNormal ? 1.55 : 1.5,
//           }}
//         >
//           <h2
//             style={{
//               margin: isNormal ? "0 0 10px" : "0 0 9px",

//               color: "#0b1d57",

//               fontSize: isNormal ? "22px" : "21px",
//               lineHeight: 1.2,

//               fontWeight: 700,
//             }}
//           >
//             {profile.interpretationTitle}
//           </h2>

//           <div>{profile.interpretation}</div>
//         </div>

//         {/* =====================================================
//           SPECIALIST RECOMMENDATION
//       ====================================================== */}

//         <div
//           style={{
//             marginTop: isNormal ? "20px" : "18px",

//             padding: isNormal ? "18px 22px" : "17px 20px",

//             border: `1.5px solid ${
//               isNormal ? (riskTheme.specialistBorder ?? "#9fd0ae") : "#e6b5ba"
//             }`,

//             borderRadius: isNormal ? "16px" : "15px",

//             background: isNormal
//               ? (riskTheme.specialistBackground ?? "#f5fff8")
//               : "#fff7f7",

//             fontSize: "17px",
//             lineHeight: isNormal ? 1.55 : 1.5,
//           }}
//         >
//           <h2
//             style={{
//               margin: isNormal ? "0 0 10px" : "0 0 9px",

//               color: "#0b1d57",

//               fontSize: isNormal ? "22px" : "21px",
//               lineHeight: 1.2,

//               fontWeight: 700,
//             }}
//           >
//             {profile.specialistTitle}
//           </h2>

//           <div
//             style={{
//               marginBottom: "7px",

//               color: isNormal
//                 ? (riskTheme.specialistColor ?? "#08783a")
//                 : "#b71928",

//               fontSize: isNormal ? "20px" : "25px",
//               lineHeight: 1.2,

//               fontWeight: 900,
//             }}
//           >
//             {profile.specialist}
//           </div>

//           <div>{profile.specialistDescription}</div>
//         </div>

//         {/* =====================================================
//           DISCLAIMER
//       ====================================================== */}

//         <div
//           style={{
//             marginTop: "18px",

//             padding: isNormal ? "13px 18px" : "13px 18px",

//             border: `1${isNormal ? ".5" : ""}px solid ${
//               isNormal ? "#d9b56e" : "#d8b46d"
//             }`,

//             borderRadius: isNormal ? "14px" : "13px",

//             background: "#fffdf8",

//             color: isNormal ? "#132043" : "#102052",

//             fontSize: isNormal ? "13.5px" : "13px",
//             lineHeight: 1.45,
//           }}
//         >
//           {profile.disclaimer}
//         </div>
//       </section>
//     </ReportPage>
//   );
// }

import Image from "next/image";

import type { IFIFunctionalProfile } from "@/types/ifi-functional-profile";
import { ReportPage } from "@/components/medical-reports/ReportPage";

type PatientSex = "male" | "female" | "all";

interface IFIFunctionalConditionReportProps {
  patientName: string;
  age: number;
  sex: PatientSex;
  profile: IFIFunctionalProfile;
}

interface RiskTheme {
  card: string;
  label: string;
  value: string;
  specialistCard?: string;
  specialistValue?: string;
}

function getRiskTheme(riskLabel: string, ifiRange: number): RiskTheme {
  const normalizedRisk = riskLabel.toUpperCase();

  if (ifiRange === 0 || normalizedRisk === "NORMAL") {
    return {
      card: "border-[#9fd0ae] bg-[#f4fff7]",
      label: "text-[#236a3b]",
      value: "text-[#0f8a40]",
      specialistCard: "border-[#9fd0ae] bg-[#f5fff8]",
      specialistValue: "text-[#08783a]",
    };
  }

  if (normalizedRisk.includes("LOW RISK")) {
    return {
      card: "border-[#abd5b6] bg-[#f5fff7]",
      label: "text-[#16713b]",
      value: "text-[#168645]",
    };
  }

  if (normalizedRisk.includes("MODERATE RISK")) {
    return {
      card: "border-[#e5c98b] bg-[#fff9ee]",
      label: "text-[#956200]",
      value: "text-[#d18b00]",
    };
  }

  if (normalizedRisk.includes("VERY HIGH RISK")) {
    return {
      card: "border-[#e7a4aa] bg-[#fff2f3]",
      label: "text-[#9f1724]",
      value: "text-[#b71928]",
    };
  }

  if (normalizedRisk.includes("HIGH RISK")) {
    return {
      card: "border-[#e9b29b] bg-[#fff6f1]",
      label: "text-[#a6471e]",
      value: "text-[#cf4d21]",
    };
  }

  return {
    card: "border-[#abd5b6] bg-[#f5fff7]",
    label: "text-[#16713b]",
    value: "text-[#168645]",
  };
}

function formatAge(age: number): string {
  if (!Number.isFinite(age)) {
    return "—";
  }

  return Number.isInteger(age)
    ? String(age)
    : age.toFixed(1).replace(/\.0$/, "");
}

function getGenderImage(sex: PatientSex): string {
  return sex === "female" ? "/female-mannequin.png" : "/male-mannequins.png";
}

export default function IFIFunctionalConditionReport({
  patientName,
  age,
  sex,
  profile,
}: IFIFunctionalConditionReportProps) {
  const isNormal = profile.ifiRange === 0;
  const riskTheme = getRiskTheme(profile.riskLabel, profile.ifiRange);

  const genderImage = getGenderImage(sex);

  const displayName = patientName.trim() || "PATIENT";

  const axisConditions = [
    {
      key: "mental-intestinal",
      label: isNormal ? "GUT–BRAIN AXIS" : "MENTAL–INTESTINAL",
      value: profile.mentalIntestinal,
      headerClass: isNormal ? "bg-[#0b1d57]" : "bg-[#14834a]",
    },
    {
      key: "endocrine-metabolic",
      label: "ENDOCRINE–METABOLIC",
      value: profile.endocrineMetabolic,
      headerClass: isNormal ? "bg-[#0b1d57]" : "bg-[#0f4fbf]",
    },
    {
      key: "tumoral-proliferative",
      label: "TUMORAL–PROLIFERATIVE",
      value: profile.tumoralProliferative,
      headerClass: isNormal ? "bg-[#0b1d57]" : "bg-[#e96a16]",
    },
    {
      key: "neurological",
      label: "NEUROLOGICAL",
      value: profile.neurological,
      headerClass: isNormal ? "bg-[#0b1d57]" : "bg-[#6b2caf]",
    },
    {
      key: "cardiovascular",
      label: "CARDIOVASCULAR",
      value: profile.cardiovascular,
      headerClass: isNormal ? "bg-[#0b1d57]" : "bg-[#c51f2c]",
    },
  ] as const;

  return (
    <ReportPage>
      <section
        className={[
          "mx-auto box-border",
          "w-[1100px] min-w-[1100px] mt-13 max-w-[1100px]",
          "rounded-[20px] ",
          "bg-white font-sans",
          "[print-color-adjust:exact] [-webkit-print-color-adjust:exact]",
          isNormal
            ? "px-8 pb-[30px] pt-7 text-[#132043]"
            : "p-7 text-[#102052]",
        ].join(" ")}
      >
        {/* Header */}
        <div
          className={[
            "grid grid-cols-[1fr_250px] items-stretch",
            isNormal ? "gap-[22px]" : "gap-5",
          ].join(" ")}
        >
          {/* Title Card */}
          <div
            className={[
              "relative flex min-h-[132px] flex-col justify-center overflow-hidden",
              "border-2 border-[#bfd0ee]",
              isNormal
                ? "rounded-[18px] bg-gradient-to-b from-white to-[#f8fbff] px-6 py-[18px]"
                : "rounded-[17px] bg-[#fbfdff] p-[18px]",
            ].join(" ")}
          >
            <div className="absolute left-3 top-1/2 h-[145px] w-[58px] p[-18px] -translate-y-1/2 overflow-hidden rounded-lg opacity-[0.88]">
              <Image
                src={genderImage}
                alt=""
                fill
                priority
                sizes="90px"
                className="object-cover object-top"
              />
            </div>

            <h1
              className={[
                "m-0 pl-16 pr-5 text-center font-bold leading-[1.08] text-[#0b1d57]",
                isNormal ? "text-[40px] tracking-[0.6px]" : "text-[37px]",
              ].join(" ")}
            >
              {isNormal
                ? "IFI RANGE 0 — FIVE-AXIS FUNCTIONAL PROFILE"
                : `${displayName.toUpperCase()} · IFI RANGE ${
                    profile.ifiRange
                  } · AGE ${formatAge(age)}`}
            </h1>

            <div className="mt-2 pl-16 pr-5 text-center text-[14px] font-bold leading-[1.3] text-[#31538c]">
              {profile.subtitle}
            </div>

            {isNormal && (
              <div className="mt-[9px] text-center text-[14px] font-bold text-[#56698d]">
                {displayName.toUpperCase().split(" ")[0]} · AGE {formatAge(age)}{" "}
                · {sex.toUpperCase()}
              </div>
            )}
          </div>

          {/* Risk Card */}
          <div
            className={[
              "flex min-h-[132px] flex-col items-center justify-center",
              "border-2 p-[18px] text-center",
              isNormal ? "rounded-[18px]" : "rounded-[17px]",
              riskTheme.card,
            ].join(" ")}
          >
            <div
              className={[
                "font-extrabold leading-[1.2]",
                isNormal ? "text-[15px]" : "text-[14px]",
                riskTheme.label,
              ].join(" ")}
            >
              IFI VALUE
            </div>

            <div
              className={[
                "font-black leading-none",
                isNormal ? "my-[6px] text-[72px]" : "my-[2px] text-[70px]",
                riskTheme.value,
              ].join(" ")}
            >
              {profile.ifiRange}
            </div>

            <div
              className={[
                "font-extrabold leading-[1.25]",
                isNormal ? "text-[18px]" : "text-[14px]",
                riskTheme.label,
              ].join(" ")}
            >
              {profile.riskLabel}
            </div>
          </div>
        </div>

        {/* Intro */}
        <div
          className={[
            "border-[1.5px] text-[14px]",
            isNormal
              ? "mt-5 rounded-[16px] border-[#c7d7ef] bg-[#fbfdff] px-[22px] py-[18px] leading-[1.55]"
              : "mt-[18px] rounded-[15px] border-[#cad8ed] bg-white px-5 py-[17px] leading-[1.5]",
          ].join(" ")}
        >
          {profile.intro}
        </div>

        {/* Conditions Table */}
        <div
          className={[
            "mt-[18px] overflow-hidden",
            isNormal
              ? "rounded-[16px] border-[1.5px] border-[#cbd7ea]"
              : "rounded-[15px] border border-[#cbd7e9]",
          ].join(" ")}
        >
          <table className="w-full table-fixed border-separate border-spacing-0">
            <thead>
              <tr>
                {axisConditions.map((condition) => (
                  <th
                    key={condition.key}
                    className={[
                      "w-1/5 text-center align-middle font-bold leading-[1.25] text-white",
                      condition.headerClass,
                      isNormal
                        ? "px-[10px] py-[14px] text-[15px]"
                        : "px-2 py-[14px] text-[14px]",
                    ].join(" ")}
                  >
                    {condition.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              <tr>
                {axisConditions.map((condition, index) => (
                  <td
                    key={condition.key}
                    className={[
                      "w-1/5 break-words text-center align-middle",
                      "font-bold leading-[1.35] text-[#102052]",
                      index !== axisConditions.length - 1
                        ? "border-r border-[#e0e6f0]"
                        : "",
                      isNormal
                        ? "border-t border-[#dce4f3] px-3 py-[22px] text-[15px]"
                        : "px-[10px] py-[22px] text-[15px]",
                    ].join(" ")}
                  >
                    {isNormal ? (
                      <span className="inline-block rounded-full bg-[#eaf8ef] px-[14px] py-2 font-black text-[#08783a]">
                        {condition.value}
                      </span>
                    ) : (
                      condition.value
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Interpretation */}
        <div
          className={[
            "border-[1.5px] text-[14px]",
            isNormal
              ? "mt-5 rounded-[16px] border-[#c7d7ef] bg-[#fbfdff] px-[22px] py-[18px] leading-[1.55]"
              : "mt-[18px] rounded-[15px] border-[#cad8ed] bg-white px-5 py-[17px] leading-[1.5]",
          ].join(" ")}
        >
          <h2
            className={[
              "font-bold leading-[1.2] text-[#0b1d57]",
              isNormal ? "mb-[10px] text-[22px]" : "mb-[9px] text-[21px]",
            ].join(" ")}
          >
            {profile.interpretationTitle}
          </h2>

          <p className="m-0">{profile.interpretation}</p>
        </div>

        {/* Specialist Recommendation */}
        <div
          className={[
            "border-[1.5px] text-[14px]",
            isNormal
              ? [
                  "mt-5 rounded-[16px] px-[22px] py-[18px] leading-[1.55]",
                  riskTheme.specialistCard,
                ].join(" ")
              : "mt-[18px] rounded-[15px] border-[#e6b5ba] bg-[#fff7f7] px-5 py-[17px] leading-[1.5]",
          ].join(" ")}
        >
          <h2
            className={[
              "font-bold leading-[1.2] text-[#0b1d57]",
              isNormal ? "mb-[10px] text-[22px]" : "mb-[9px] text-[21px]",
            ].join(" ")}
          >
            {profile.specialistTitle}
          </h2>

          <div
            className={[
              "mb-[7px] font-black leading-[1.2]",
              isNormal
                ? `text-[20px] ${riskTheme.specialistValue ?? "text-[#08783a]"}`
                : "text-[25px] text-[#b71928]",
            ].join(" ")}
          >
            {profile.specialist}
          </div>

          <p className="m-0">{profile.specialistDescription}</p>
        </div>

        {/* Disclaimer */}
        <div
          className={[
            "mt-[18px] bg-[#fffdf8] px-[18px] py-[13px]",
            "leading-[1.45]",
            isNormal
              ? "rounded-[14px] border-[1.5px] border-[#d9b56e] text-[13.5px] text-[#132043]"
              : "rounded-[13px] border border-[#d8b46d] text-[13px] text-[#102052]",
          ].join(" ")}
        >
          {profile.disclaimer}
        </div>
        <div className="flex justify-center py-4">
          <a
            href={`${process.env.NEXT_PUBLIC_APP_URL}/ifi-explained`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-semibold text-[#5B3FA6] underline underline-offset-4"
          >
            Explore IFI Values
            <span aria-hidden="true">→</span>
          </a>
        </div>
      </section>
    </ReportPage>
  );
}
