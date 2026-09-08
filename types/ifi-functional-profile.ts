export type IFIProfileSex = "all" | "male" | "female";

export interface IFIFunctionalProfile {
  id: string;

  sex: IFIProfileSex;
  ifiRange: number;

  riskLabel: string;
  subtitle: string;
  intro: string;

  mentalIntestinal: string;
  endocrineMetabolic: string;
  tumoralProliferative: string;
  neurological: string;
  cardiovascular: string;

  interpretationTitle: string;
  interpretation: string;

  specialistTitle: string;
  specialist: string;
  specialistDescription: string;

  disclaimer: string;

  version: number;
  isActive: boolean;

  createdAt: string;
  updatedAt: string;
}
