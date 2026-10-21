import { NextResponse } from "next/server";
import {
  BAHIA_MACRORREGIOES,
  BAHIA_NRS,
  BAHIA_BRS,
  ALL_BAHIA_MUNICIPIOS,
  OFFICIAL_BAHIA_UNITS,
} from "@/lib/territory-data";
import { Municipio } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const brs = searchParams.get("brs");
  const nrs = searchParams.get("nrs");
  const macro = searchParams.get("macro");
  const q = (searchParams.get("q") || "").trim().toLowerCase();

  let filtered: Municipio[] = ALL_BAHIA_MUNICIPIOS;

  if (brs) {
    filtered = filtered.filter(
      (m: Municipio) => (m.brs_name || "").toLowerCase().includes(brs.toLowerCase())
    );
  }
  if (nrs) {
    filtered = filtered.filter(
      (m: Municipio) => (m.nrs_name || "").toLowerCase().includes(nrs.toLowerCase())
    );
  }
  if (macro) {
    filtered = filtered.filter(
      (m: Municipio) => (m.macroregion || "").toLowerCase().includes(macro.toLowerCase())
    );
  }
  if (q) {
    filtered = filtered.filter(
      (m: Municipio) =>
        m.name.toLowerCase().includes(q) ||
        m.ibge_code.includes(q)
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
