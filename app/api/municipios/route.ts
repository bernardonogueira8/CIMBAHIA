import { NextResponse } from "next/server";
import {
  BAHIA_MACRORREGIOES,
  BAHIA_NRS,
  BAHIA_BRS,
  ALL_BAHIA_MUNICIPIOS,
  OFFICIAL_BAHIA_UNITS,
} from "@/lib/territory-data";
import { Municipio } from "@/lib/types";

import { matchNormalized } from "@/lib/utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const brs = searchParams.get("brs");
  const nrs = searchParams.get("nrs");
  const macro = searchParams.get("macro");
  const q = searchParams.get("q");

  let filtered: Municipio[] = ALL_BAHIA_MUNICIPIOS;

  if (brs) {
    filtered = filtered.filter((m: Municipio) =>
      matchNormalized(m.brs_name, brs)
    );
  }
  if (nrs) {
    filtered = filtered.filter((m: Municipio) =>
      matchNormalized(m.nrs_name, nrs)
    );
  }
  if (macro) {
    filtered = filtered.filter((m: Municipio) =>
      matchNormalized(m.macroregion, macro)
    );
  }
  if (q) {
    filtered = filtered.filter(
      (m: Municipio) =>
        matchNormalized(m.name, q) ||
        m.ibge_code.includes(q) ||
        matchNormalized(m.brs_name, q)
    );
  }

  return NextResponse.json({
    total: filtered.length,
    macrorregioes: BAHIA_MACRORREGIOES,
    nrs: BAHIA_NRS,
    brs: BAHIA_BRS,
    units: OFFICIAL_BAHIA_UNITS,
    municipios: filtered,
  });
}
