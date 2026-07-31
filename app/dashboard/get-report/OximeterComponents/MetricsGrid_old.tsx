import { Table, TrendingUp } from "lucide-react";

function MetricsGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 p-3 gap-4">
      {/* <!-- Heart Rate Card --> */}
      <div className="bg-white p-3 rounded-lg border border-outline-variant shadow-2xs flex flex-col gap-2">
        <div className="flex justify-between items-start">
          <div>
            <p className=" text-[17px] font-medium text-on-surface-variant uppercase tracking-wider">
              Heart Rate
            </p>
            <p className="text-4xl font-semibold text-primary">
              72
              <span className="text-[17px] font-semibold text-on-surface-variant">
                BPM
              </span>
            </p>
          </div>
          <span className="px-2 py-1 bg-on-tertiary-container/10 text-on-tertiary-container rounded-full text-[13px] ">
            Normal
          </span>
        </div>
        <div className="sparkline-container mt-auto">
          {/* <!-- Visual representation of a sparkline --> */}
          <svg className="w-full h-full">
            <path
              d="M0,35 Q10,10 20,25 T40,15 T60,30 T80,10 T100,20 T120,5 T140,25 T160,15 T180,30 T200,20"
              fill="none"
              stroke="#0051d4"
              stroke-width="2"
              vector-effect="non-scaling-stroke"
            ></path>
          </svg>
        </div>
        <p className="text-[13px]  text-on-surface-variant flex items-center gap-xs">
          <span
            className="material-symbols-outlined text-xs text-on-tertiary-container"
            data-icon="trending_up"
          >
            <TrendingUp />
          </span>
          +2% from baseline
        </p>
      </div>
      {/* <!-- SpO2 Card --> */}
      <div className="bg-white p-3 rounded-lg border border-outline-variant shadow-sm flex flex-col gap-2">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-label-md text-[17px] font-medium text-on-surface-variant uppercase tracking-wider">
              SpO2
            </p>
            <p className="text-4xl font-semibold text-primary">
              98
              <span className="text-[17px] font-semibold text-on-surface-variant">
                %
              </span>
            </p>
          </div>
          <span className="px-2 py-1 bg-on-tertiary-container/10 text-on-tertiary-container rounded-full text-[13px] ">
            Normal
          </span>
        </div>
        <div className="sparkline-container mt-auto">
          <svg className="w-full h-full">
            <path
              d="M0,20 Q20,18 40,20 T80,19 T120,21 T160,20 T200,19"
              fill="none"
              stroke="#00af9e"
              stroke-width="2"
              vector-effect="non-scaling-stroke"
            ></path>
          </svg>
        </div>
        <p className="text-[13px]  text-on-surface-variant flex items-center gap-xs">
          <span
            className="material-symbols-outlined text-xs text-on-tertiary-container"
            data-icon="stable"
          >
            <Table />
          </span>
          Stable saturation level
        </p>
      </div>
    </div>
  );
}

export default MetricsGrid;
