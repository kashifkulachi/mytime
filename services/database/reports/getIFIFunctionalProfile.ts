import type {
  IFIFunctionalProfile,
  IFIProfileSex,
} from "@/types/ifi-functional-profile";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type PatientSex = "male" | "female";

interface GetIFIFunctionalProfileInput {
  sex: PatientSex;
  ifiRange: number;
  version?: number;
}

interface IFIFunctionalProfileRow {
  id: string;

  sex: IFIProfileSex;
  ifi_range: number;

  risk_label: string;
  subtitle: string;
  intro: string;

  mental_intestinal: string;
  endocrine_metabolic: string;
  tumoral_proliferative: string;
  neurological: string;
  cardiovascular: string;

  interpretation_title: string;
  interpretation: string;

  specialist_title: string;
  specialist: string;
  specialist_description: string;

  disclaimer: string;

  version: number;
  is_active: boolean;

  created_at: string;
  updated_at: string;
}

function mapRowToIFIFunctionalProfile(
  row: IFIFunctionalProfileRow,
): IFIFunctionalProfile {
  return {
    id: row.id,

    sex: row.sex,
    ifiRange: row.ifi_range,

    riskLabel: row.risk_label,
    subtitle: row.subtitle,
    intro: row.intro,

    mentalIntestinal: row.mental_intestinal,
    endocrineMetabolic: row.endocrine_metabolic,
    tumoralProliferative: row.tumoral_proliferative,
    neurological: row.neurological,
    cardiovascular: row.cardiovascular,

    interpretationTitle: row.interpretation_title,
    interpretation: row.interpretation,

    specialistTitle: row.specialist_title,
    specialist: row.specialist,
    specialistDescription: row.specialist_description,

    disclaimer: row.disclaimer,

    version: row.version,
    isActive: row.is_active,

    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getIFIFunctionalProfile({
  sex,
  ifiRange,
  version,
}: GetIFIFunctionalProfileInput): Promise<IFIFunctionalProfile> {
  if (!Number.isInteger(ifiRange)) {
    throw new Error("IFI Range must be an integer.");
  }

  if (ifiRange < 0 || ifiRange > 25) {
    throw new Error("IFI Range must be between 0 and 25.");
  }

  if (version !== undefined) {
    if (!Number.isInteger(version) || version < 1) {
      throw new Error(
        "IFI functional profile version must be a positive integer.",
      );
    }
  }

  const lookupSex: IFIProfileSex = ifiRange === 0 ? "all" : sex;

  const supabaseAdmin = createSupabaseAdminClient();

  let query = supabaseAdmin
    .from("ifi_functional_profiles")
    .select(
      `
        id,
        sex,
        ifi_range,
        risk_label,
        subtitle,
        intro,
        mental_intestinal,
        endocrine_metabolic,
        tumoral_proliferative,
        neurological,
        cardiovascular,
        interpretation_title,
        interpretation,
        specialist_title,
        specialist,
        specialist_description,
        disclaimer,
        version,
        is_active,
        created_at,
        updated_at
      `,
    )
    .eq("sex", lookupSex)
    .eq("ifi_range", ifiRange);

  if (version !== undefined) {
    query = query.eq("version", version);
  } else {
    query = query.eq("is_active", true).order("version", { ascending: false });
  }

  const { data, error } = await query.limit(1).maybeSingle();

  if (error) {
    throw new Error(
      `Failed to retrieve IFI functional profile: ${error.message}`,
    );
  }

  if (!data) {
    throw new Error(
      `IFI functional profile not found for sex "${lookupSex}" and IFI Range ${ifiRange}${
        version !== undefined ? `, version ${version}` : ""
      }.`,
    );
  }

  return mapRowToIFIFunctionalProfile(data as IFIFunctionalProfileRow);
}
