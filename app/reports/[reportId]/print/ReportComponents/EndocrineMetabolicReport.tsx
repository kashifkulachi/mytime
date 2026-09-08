import { ReportPage } from "@/components/medical-reports/ReportPage";
import Image from "next/image";

function EndocrineMetabolicReport() {
  return (
    <ReportPage>
      <div className="mt-auto flex justify-center items-center ">
        <Image
          src="/endocrine.jpg"
          fill
          loading="eager"
          alt="endocrine"
          quality={100}
          unoptimized
          className="object-fill my-auto inline mx-auto max-w-[1100px] max-h-[1000px] bg-[##FBFCFD]"
        />
      </div>
    </ReportPage>
  );
}

export default EndocrineMetabolicReport;
