import { ReportPage } from "@/components/medical-reports/ReportPage";
import Image from "next/image";

function NeurologicalReport() {
  return (
    <ReportPage>
      <div className="mt-auto flex justify-center items-center ">
        <Image
          src="/neurological.jpg"
          fill
          loading="eager"
          alt="Neurological"
          quality={100}
          unoptimized
          className="object-fill my-auto inline mx-auto max-w-[1100px] max-h-[1000px] bg-[#FEFEFE]"
        />
      </div>
    </ReportPage>
  );
}

export default NeurologicalReport;
