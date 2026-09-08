import { ReportPage } from "@/components/medical-reports/ReportPage";
import Image from "next/image";

function TumoralReport() {
  return (
    <ReportPage>
      <div className="mt-auto flex justify-center items-center ">
        <Image
          src="/tumor.jpg"
          fill
          loading="eager"
          alt="Tumor"
          unoptimized
          quality={100}
          className="object-fill my-auto inline mx-auto max-w-[1100px] max-h-[1000px] bg-[#FEFEFE]"
        />
      </div>
    </ReportPage>
  );
}

export default TumoralReport;
