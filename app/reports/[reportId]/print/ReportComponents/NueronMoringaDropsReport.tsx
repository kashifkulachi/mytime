import { ReportPage } from "@/components/medical-reports/ReportPage";
import {
  Atom,
  BrainCircuit,
  Check,
  CircleGauge,
  Droplets,
  FlaskConical,
  HeartPulse,
  Leaf,
  ShieldCheck,
  Smile,
  Syringe,
  Zap,
} from "lucide-react";

export interface NueronMoringaDropsReportProps {
  productName: string;
  activeIngredients: string;
  category: string;
  recommendedDrops: number;
  unit: string;
  className?: string;
}

// function formatDrops(value: number, unit: string) {
//   return Number.isFinite(value)
//     ? `${value.toFixed(2)} ${unit.toUpperCase()}`
//     : `— ${unit.toUpperCase()}`;
// }

function formatDrops(value: number, unit: string) {
  if (!Number.isFinite(value)) {
    return `— ${unit.toUpperCase()}`;
  }

  return `${Math.round(value)} ${unit.toUpperCase()}`;
}

export default function NueronMoringaDropsReport({
  productName,
  activeIngredients,
  category,
  recommendedDrops,
  unit,
  className = "",
}: NueronMoringaDropsReportProps) {
  const dose = formatDrops(recommendedDrops, unit);
  return (
    <ReportPage>
      <section
        aria-label="Neuron ON Moringa drops nutritional supplement report"
        className={`mx-auto w-[800px] min-w-[800px] overflow-hidden bg-white px-3 py-2 font-sans text-[#071d74]  ${className}`}
      >
        <header className="text-center">
          <h1 className="text-[47px] font-black leading-none tracking-[-.04em] text-[#09236f]">
            NEURON <span className="text-[#1d66bc]">ON</span>
            <sup className="text-[12px]">™</sup>
          </h1>
          <p className="text-[25px] font-black leading-none">
            ACTIVATE. FOCUS. CONNECT.
          </p>
          <p className="mt-1 text-[13px] font-bold">
            NUTRITIONAL SUPPORT FOR BRAIN FUNCTION, ENERGY &amp; WELL-BEING
          </p>
        </header>
        <div className="mt-2 flex h-[88px] items-center overflow-hidden rounded-[8px] bg-[radial-gradient(circle_at_70%_40%,#0c8cff_0%,#072b95_30%,#020e4f_72%)] px-7 text-white">
          <BrainCircuit className="mr-5 h-14 w-14 rounded-full border border-white p-2" />
          <div>
            <p className="text-[23px] font-black leading-none">
              NEURON ON ACTIVATES (ON)
            </p>
            <p className="mt-1 text-[24px] font-black leading-none text-[#6ed038]">
              NEURONAL NETWORKS
            </p>
            <p className="mt-1 text-[12px] font-semibold">
              Fuels the brain. Enhances communication. Elevates life.
            </p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-[155px_1fr_300px] gap-4">
          <MoringaCard />
          <div className="flex items-center justify-center">
            <Bottle
              productName={productName}
              activeIngredients={activeIngredients}
              dose={dose}
            />
          </div>
          <Benefits />
        </div>
        <div className="mt-2 rounded-[8px] border border-[#a7b5e8]">
          <p className="py-1 text-center text-[13px] font-black">
            FULL SPECTRUM OF VITAMINS, MINERALS, AMINO ACIDS &amp;
            PHYTONUTRIENTS
            <br />
            FROM NATURE – NATURE’S PERFECT NUTRITION
          </p>
          <div className="grid grid-cols-[1fr_170px] border-t border-[#9eadde]">
            <IngredientsTable />
            <DoseCard dose={dose} category={category} />

            <div className="mt-[-80px] grid grid-cols-4 justify-center rounded-[8px] border border-[#a7b5e8] py-2">
              <Feature
                icon={Leaf}
                tone="#16803b"
                title="PLANT-BASED NUTRITION"
                text="Derived from 100% Moringa Oleifera leaf extract."
              />
              <Feature
                icon={Atom}
                tone="#074aa4"
                title="FULL SPECTRUM FORMULA"
                text="Contains the complete profile of vitamins, minerals, amino acids and phytonutrients."
              />
              <Feature
                icon={Droplets}
                tone="#5b168f"
                title="HIGHLY BIOAVAILABLE"
                text="Sub-lingual delivery for maximum absorption and effectiveness."
              />
              <Feature
                icon={FlaskConical}
                tone="#064b9c"
                title="CLEAN & PURE"
                text="Non-GMO, gluten-free, dairy-free, soy-free, no artificial colors or preservatives."
              />
              <Feature
                icon={HeartPulse}
                tone="#197a37"
                title="SCIENCE + NATURE"
                text="Backed by nutrition science and the power of nature for brain & body."
                last
              />
            </div>
          </div>
        </div>

        <footer className="mt-2">
          <div className="flex items-center justify-between rounded-[8px] bg-[#071e78] px-5 py-2 text-white">
            <div className="flex items-center gap-3">
              <BrainCircuit className="h-8 w-8" />
              <div>
                <p className="text-[22px] font-black leading-none">
                  NEURON ON<sup className="text-[8px]">™</sup>
                </p>
                <p className="text-[10px] font-semibold text-[#75d93b]">
                  TURN YOUR BRAIN ON. LIVE YOUR BEST VERSION.
                </p>
              </div>
            </div>
            <p className="border-x border-white/40 px-6 text-center text-[11px] font-black">
              DIETARY SUPPLEMENT
              <br />1 OZ / 30 ML
            </p>
            <div className="flex items-center gap-2 rounded-full bg-white px-4 py-1 text-[#247a28]">
              <Leaf className="h-7 w-7" />
              <span className="text-[11px] font-black leading-none">
                MADE WITH
                <br />
                MORINGA OLEIFERA
              </span>
            </div>
          </div>
          <p className="mt-1 rounded-[6px] border border-[#8fa1dc] py-1 text-center text-[9px] font-semibold text-[#0a2472]">
            These statements have not been evaluated by the Food and Drug
            Administration.
            <br />
            This product is not intended to diagnose, treat, cure or prevent any
            disease.
          </p>
        </footer>
      </section>
    </ReportPage>
  );
}

function MoringaCard() {
  return (
    <aside className="rounded-[8px] border border-[#a7b5e8] px-3 py-3 text-center">
      <p className="text-[16px] font-black leading-none">
        FULL SPECTRUM
        <br />
        VITAMINS FROM
        <br />
        MORINGA
      </p>
      <div className="mx-auto my-4 flex h-[84px] w-[84px] items-center justify-center rounded-full border-2 border-[#164820]">
        <Leaf className="h-14 w-14 text-[#23752d]" />
      </div>
      <p className="text-[12px] font-semibold leading-snug">
        Made with 100%
        <br />
        Moringa Oleifera
        <br />
        leaf extract
      </p>
      <div className="my-3 h-px bg-[#8ea2dc]" />
      <p className="text-[12px] font-semibold leading-snug">
        Nature’s most complete source of essential nutrients.
      </p>
    </aside>
  );
}
function Bottle({
  productName,
  activeIngredients,
  dose,
}: {
  productName: string;
  activeIngredients: string;
  dose: string;
}) {
  return (
    <div className="relative h-[315px] w-[220px] pt-10">
      <div className="absolute left-[74px] top-0 h-[56px] w-[72px] rounded-t-[15px] border-x-[8px] border-[#1b1d22] bg-[linear-gradient(90deg,#17191c,#52585d,#111316)]" />
      <div className="absolute left-[56px] top-[40px] h-[45px] w-[108px] rounded-[8px] bg-[repeating-linear-gradient(90deg,#111_0_5px,#3a3a3a_5px_9px)] shadow-md" />
      <div className="absolute left-[34px] top-[75px] h-[230px] w-[152px] overflow-hidden rounded-b-[24px] border-x-[5px] border-b-[6px] border-[#12203a] bg-[linear-gradient(90deg,#030816,#0d42ad_14%,#09206f_48%,#0d4ec3_82%,#020713)] shadow-[inset_13px_0_16px_rgba(0,0,0,.5),inset_-12px_0_16px_rgba(0,0,0,.5),0_10px_15px_rgba(19,35,77,.35)] before:absolute before:left-[20px] before:top-0 before:h-full before:w-[18px] before:bg-white/20 before:blur-sm before:content-['']">
        <div className="absolute left-[13px] top-[60px] w-[116px] rounded-[4px] bg-[linear-gradient(120deg,#f9f4d5,#e8dfb5_40%,#fffbea_70%,#d6cb9a)] px-2 py-3 text-center text-[#061964]">
          <p className="text-[11px] font-serif font-black italic">ELIDANLORD</p>
          <p className="mt-3 text-[21px] font-black leading-[.8]">
            {productName.replace("®", "").toUpperCase().replace(" ", "\n")}
          </p>
          <p className="mt-2 text-[6px] font-semibold">{activeIngredients}</p>
          <div className="my-2 h-px bg-[#081e6a]" />
          <p className="text-[7px] font-black">Daily supplement</p>
          <p className="mt-1 text-[8px] font-black">{dose}</p>
          <p className="mt-3 text-[10px] font-black">1 OZ / 30 ML</p>
        </div>
      </div>
    </div>
  );
}
function Benefits() {
  const rows = [
    [
      BrainCircuit,
      "#0c4cad",
      "ACTIVATES NEURONAL NETWORKS",
      "Supports synaptic communication and neuronal plasticity.",
    ],
    [
      CircleGauge,
      "#0749b7",
      "ENHANCES FOCUS & CLARITY",
      "Improves concentration, memory and mental performance.",
    ],
    [
      Zap,
      "#1046ae",
      "BOOSTS ENERGY NATURALLY",
      "Supports cellular energy production and reduces mental fatigue.",
    ],
    [
      ShieldCheck,
      "#123f9e",
      "SUPPORTS NEUROPROTECTION",
      "Rich in antioxidants that help protect brain cells.",
    ],
    [
      Smile,
      "#174fa5",
      "PROMOTES WELL-BEING & MOOD BALANCE",
      "Supports a positive mood, emotional balance and mental wellness.",
    ],
  ] as const;
  return (
    <aside className="space-y-0">
      {rows.map(([Icon, color, title, text], index) => (
        <div
          key={title}
          className={`flex gap-3 border border-[#9caee5] px-3 py-2 ${index ? "border-t-0" : "rounded-t-[8px]"} ${index === rows.length - 1 ? "rounded-b-[8px]" : ""}`}
        >
          <span
            className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full border border-[#8a9ee1]"
            style={{ color }}
          >
            <Icon className="h-7 w-7" />
          </span>
          <p className="text-[10px] font-semibold leading-snug">
            <strong className="text-[13px] leading-none" style={{ color }}>
              {title}
            </strong>
            <br />
            {text}
          </p>
        </div>
      ))}
    </aside>
  );
}
function IngredientsTable() {
  const rows = [
    [
      "VITAMINS",
      "Vitamin A (as Beta-Carotene)\nVitamin C (as Ascorbic Acid)\nVitamin D3 (as Cholecalciferol)\nVitamin E (as d-Alpha Tocopherol)\nVitamin K2 (as MK-7)",
      "8,000 IU\n200 mg\n2,000 IU\n3 IU\n80 mcg",
      "26.6 IU\n6.7 mg\n66 IU\n0.1 mg\n2.7 mcg",
    ],
    [
      "MINERALS",
      "Calcium\nMagnesium\nPotassium\nIron\nZinc\nSelenium\nManganese",
      "100 mg\n50 mg\n15 mg\n5 mg\n3 mg\n70 mcg\n1 mg",
      "3.3 mg\n1.7 mg\n5 mg\n0.17 mg\n0.10 mg\n2.3 mcg\n0.03 mg",
    ],
    [
      "AMINO ACIDS",
      "Essential Amino Acids (EAAs)\nNon-Essential Amino Acids\nComplete Amino Acid Profile",
      "1,200 mg\n800 mg\nFull Spectrum",
      "40 mg\n27 mg\nFull Spectrum",
    ],
    [
      "PHYTONUTRIENTS",
      "Flavonoids (Quercetin, Kaempferol, etc.)\nPolyphenols\nChlorophyll\nCarotenoids & Isothiocyanates",
      "120 mg\n90 mg\n45 mg\n60 mg",
      "4 mg\n3 mg\n1.5 mg\n2 mg",
    ],
  ];
  return (
    <div>
      <p className="bg-[#081f75] py-1 text-center text-[12px] font-black text-white">
        KEY INGREDIENTS (PER 1 OZ / 30 ML)
      </p>
      <table className="w-full table-fixed border-collapse text-[8px] leading-tight">
        <thead className="bg-[#eef2ff] font-black">
          <tr>
            <th className="w-[24%] border-r border-[#a2b1df] py-1">
              NUTRIENT CATEGORY
            </th>
            <th className="w-[40%] border-r border-[#a2b1df]">INGREDIENTS</th>
            <th className="w-[18%] border-r border-[#a2b1df]">
              AMOUNT
              <br />
              PER BOTTLE
            </th>
            <th className="w-[18%]">
              AMOUNT
              <br />
              PER DAILY DOSE
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([category, ingredients, bottle, daily]) => (
            <tr key={category} className="border-t border-[#aebbe5]">
              <td className="border-r border-[#aebbe5] px-2 py-2 text-center font-black text-[#15552c]">
                {category}
              </td>
              <td className="whitespace-pre-line border-r border-[#aebbe5] px-2 py-1">
                {ingredients}
              </td>
              <td className="whitespace-pre-line border-r border-[#aebbe5] px-2 py-1 text-center">
                {bottle}
              </td>
              <td className="whitespace-pre-line px-2 py-1 text-center">
                {daily}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function DoseCard({ dose, category }: { dose: string; category: string }) {
  return (
    <aside className="m-2 rounded-[7px] border border-[#9caee5] px-1 py-0 text-center">
      <p className="rounded-t-[5px] bg-[#082076] py-1 text-[11px] font-black text-white">
        RECOMMENDED DAILY DOSE
      </p>
      <div className="flex">
        <Syringe className="mx-auto mt-3 h-10 w-10 text-[#082076]" />
        <p className="mt-1  leading-none font-bold uppercase">
          <span className="text-[23px] font-black block">1 ml</span>
          <span className="text-[14px]">({dose}) DAILY</span>
        </p>
      </div>
      <p className="mt-3 text-[10px] font-semibold leading-snug">
        Place under the tongue, hold for 30–60 seconds and swallow.
      </p>
      <div className="my-3 h-px bg-[#a9b7e2]" />
      <p className="text-left text-[10px] font-semibold leading-loose">
        <Check className="mr-1 inline h-3 w-3 text-[#17752c]" />
        Shake well before use
        <br />
        <Check className="mr-1 inline h-3 w-3 text-[#17752c]" />
        Can be taken with or without food
        <br />
        <Check className="mr-1 inline h-3 w-3 text-[#17752c]" />
        Consistent daily use for optimal results
      </p>
      <p className="mt-3 rounded-[6px] bg-[#082076] px-2 py-2 text-[10px] font-black text-white">
        {category.toUpperCase()}
        <br />
        ONE BOTTLE (30 ML) = 30 DAILY DOSES
      </p>
    </aside>
  );
}
function Feature({
  icon: Icon,
  tone,
  title,
  text,
  last = false,
}: {
  icon: typeof Leaf;
  tone: string;
  title: string;
  text: string;
  last?: boolean;
}) {
  return (
    <div
      className={`flex gap-2 px-3 ${last ? "col-span-2 mt-3" : " border-r border-[#c6d0ed]"}`}
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white"
        style={{ backgroundColor: tone }}
      >
        <Icon className="h-6 w-6" />
      </span>
      <p className="text-[9px] font-semibold leading-snug">
        <strong style={{ color: tone }}>{title}</strong>
        <br />
        {text}
      </p>
    </div>
  );
}
