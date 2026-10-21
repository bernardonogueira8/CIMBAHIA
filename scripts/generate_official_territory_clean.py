# -*- coding: utf-8 -*-
"""
Script para gerar lib/territory-data.ts e supabase/seed-28-units-bahia.sql
com todas as 28 Bases Regionais de Saúde e Núcleos (19 BRS + 9 NRS Sedes),
417 Municípios da Bahia e com E-mail, Telefone e Farmacêuticos ZERADOS
para cadastro manual pelo gestor.
Fonte: data/municipios_completo.xlsx
"""

import openpyxl
import json
import uuid

NAMESPACE_BAHIA = uuid.UUID('ba000000-0000-0000-0000-000000000000')

KNOWN_UUIDS = {
    'BRS Paulo Afonso': '11111111-1111-1111-1111-111111111111',
    'NRS Juazeiro': '22222222-2222-2222-2222-222222222222',
    'NRS Feira de Santana': '33333333-3333-3333-3333-333333333333',
    'NRS Vitória da Conquista': '44444444-4444-4444-4444-444444444444',
    'NRS Salvador': '55555555-5555-5555-5555-555555555555',
}

# Dados territoriais oficiais (Sedes e Macrorregiões)
UNIT_METADATA = {
    "BRS Brumado": { "municipality": "Brumado", "macroregion": "Sudoeste", "nrs_parent": "NRS Vitória da Conquista" },
    "BRS Camaçari": { "municipality": "Camaçari", "macroregion": "Leste", "nrs_parent": "NRS Salvador" },
    "BRS Cruz das Almas": { "municipality": "Cruz das Almas", "macroregion": "Leste", "nrs_parent": "NRS Salvador" },
    "BRS Guanambi": { "municipality": "Guanambi", "macroregion": "Sudoeste", "nrs_parent": "NRS Vitória da Conquista" },
    "BRS Ibotirama": { "municipality": "Ibotirama", "macroregion": "Oeste", "nrs_parent": "NRS Barreiras" },
    "BRS Irecê": { "municipality": "Irecê", "macroregion": "Centro Norte", "nrs_parent": "NRS Jacobina" },
    "BRS Itaberaba": { "municipality": "Itaberaba", "macroregion": "Centro Leste", "nrs_parent": "NRS Feira de Santana" },
    "BRS Itabuna": { "municipality": "Itabuna", "macroregion": "Sul", "nrs_parent": "NRS Ilhéus" },
    "BRS Itapetinga": { "municipality": "Itapetinga", "macroregion": "Sudoeste", "nrs_parent": "NRS Vitória da Conquista" },
    "BRS Jequié": { "municipality": "Jequié", "macroregion": "Sul", "nrs_parent": "NRS Ilhéus" },
    "BRS Paulo Afonso": { "municipality": "Paulo Afonso", "macroregion": "Norte", "nrs_parent": "NRS Juazeiro" },
    "BRS Porto Seguro": { "municipality": "Porto Seguro", "macroregion": "Extremo Sul", "nrs_parent": "NRS Teixeira de Freitas" },
    "BRS Ribeira do Pombal": { "municipality": "Ribeira do Pombal", "macroregion": "Nordeste", "nrs_parent": "NRS Alagoinhas" },
    "BRS Santa Maria da Vitória": { "municipality": "Santa Maria da Vitória", "macroregion": "Oeste", "nrs_parent": "NRS Barreiras" },
    "BRS Santo Antônio de Jesus": { "municipality": "Santo Antônio de Jesus", "macroregion": "Leste", "nrs_parent": "NRS Salvador" },
    "BRS Seabra": { "municipality": "Seabra", "macroregion": "Centro Leste", "nrs_parent": "NRS Feira de Santana" },
    "BRS Senhor do Bonfim": { "municipality": "Senhor do Bonfim", "macroregion": "Norte", "nrs_parent": "NRS Juazeiro" },
    "BRS Serrinha": { "municipality": "Serrinha", "macroregion": "Centro Leste", "nrs_parent": "NRS Feira de Santana" },
    "BRS Valença": { "municipality": "Valença", "macroregion": "Sul", "nrs_parent": "NRS Ilhéus" },
    "NRS Alagoinhas": { "municipality": "Alagoinhas", "macroregion": "Nordeste", "nrs_parent": "NRS Alagoinhas" },
    "NRS Barreiras": { "municipality": "Barreiras", "macroregion": "Oeste", "nrs_parent": "NRS Barreiras" },
    "NRS Feira de Santana": { "municipality": "Feira de Santana", "macroregion": "Centro Leste", "nrs_parent": "NRS Feira de Santana" },
    "NRS Ilhéus": { "municipality": "Ilhéus", "macroregion": "Sul", "nrs_parent": "NRS Ilhéus" },
    "NRS Jacobina": { "municipality": "Jacobina", "macroregion": "Centro Norte", "nrs_parent": "NRS Jacobina" },
    "NRS Juazeiro": { "municipality": "Juazeiro", "macroregion": "Norte", "nrs_parent": "NRS Juazeiro" },
    "NRS Salvador": { "municipality": "Salvador", "macroregion": "Leste", "nrs_parent": "NRS Salvador" },
    "NRS Teixeira de Freitas": { "municipality": "Teixeira de Freitas", "macroregion": "Extremo Sul", "nrs_parent": "NRS Teixeira de Freitas" },
    "NRS Vitória da Conquista": { "municipality": "Vitória da Conquista", "macroregion": "Sudoeste", "nrs_parent": "NRS Vitória da Conquista" }
}

NRS_LIST = [
    {"id": "nrs-1", "code": "NRS-NORDESTE", "name": "NRS Alagoinhas", "macroregion": "Nordeste"},
    {"id": "nrs-2", "code": "NRS-OESTE", "name": "NRS Barreiras", "macroregion": "Oeste"},
    {"id": "nrs-3", "code": "NRS-CENTRO-LESTE", "name": "NRS Feira de Santana", "macroregion": "Centro Leste"},
    {"id": "nrs-4", "code": "NRS-SUL", "name": "NRS Ilhéus", "macroregion": "Sul"},
    {"id": "nrs-5", "code": "NRS-CENTRO-NORTE", "name": "NRS Jacobina", "macroregion": "Centro Norte"},
    {"id": "nrs-6", "code": "NRS-NORTE", "name": "NRS Juazeiro", "macroregion": "Norte"},
    {"id": "nrs-7", "code": "NRS-LESTE", "name": "NRS Salvador", "macroregion": "Leste"},
    {"id": "nrs-8", "code": "NRS-EXTREMO-SUL", "name": "NRS Teixeira de Freitas", "macroregion": "Extremo Sul"},
    {"id": "nrs-9", "code": "NRS-SUDOESTE", "name": "NRS Vitória da Conquista", "macroregion": "Sudoeste"},
]

def main():
    print("Lendo planilha data/municipios_completo.xlsx...")
    wb = openpyxl.load_workbook("data/municipios_completo.xlsx", data_only=True)
    sheet = wb["Municipios"]
    rows = list(sheet.iter_rows(values_only=True))[1:]

    unit_muns = {}
    for r in rows:
        ibge_code = str(r[0]).strip()
        mun_name = str(r[1]).strip()
        brs_raw = str(r[2]).strip()
        macro_raw = str(r[3]).strip() if r[3] else "Norte"

        if brs_raw not in unit_muns:
            unit_muns[brs_raw] = []

        unit_muns[brs_raw].append({
            "ibge_code": ibge_code,
            "name": mun_name,
            "macroregion": macro_raw
        })

    unit_id_map = {}
    for u_name in UNIT_METADATA.keys():
        if u_name in KNOWN_UUIDS:
            unit_id_map[u_name] = KNOWN_UUIDS[u_name]
        else:
            unit_id_map[u_name] = str(uuid.uuid5(NAMESPACE_BAHIA, u_name))

    all_municipios = []
    official_units = []

    brs_names = sorted([u for u in UNIT_METADATA.keys() if u.startswith("BRS ")])
    nrs_names = sorted([u for u in UNIT_METADATA.keys() if u.startswith("NRS ")])
    sorted_unit_names = brs_names + nrs_names

    for u_name in sorted_unit_names:
        meta = UNIT_METADATA[u_name]
        u_id = unit_id_map[u_name]
        muns_data = unit_muns.get(u_name, [])

        served_muns = []
        for m in sorted(muns_data, key=lambda x: x["name"]):
            mun_obj = {
                "id": f"mun-{m['ibge_code']}",
                "ibge_code": m["ibge_code"],
                "name": m["name"],
                "base_id": u_id,
                "brs_name": u_name,
                "nrs_name": meta["nrs_parent"],
                "macroregion": meta["macroregion"],
                "responsible_pharmacist": "",  # Zerado para cadastro manual
                "active": True
            }
            served_muns.append(mun_obj)
            all_municipios.append(mun_obj)

        unit_obj = {
            "id": u_id,
            "name": u_name,
            "macroregion": meta["macroregion"],
            "municipality": meta["municipality"],
            "email": "",                      # Zerado para cadastro manual
            "phone": "",                      # Zerado para cadastro manual
            "address": "",                    # Zerado para cadastro manual
            "active": True,
            "served_municipalities": served_muns,
            "responsible_pharmacists": []     # Zerado para cadastro manual
        }
        official_units.append(unit_obj)

    all_municipios.sort(key=lambda m: m["name"])

    bahia_brs = []
    for u in official_units:
        u_name = u["name"]
        meta = UNIT_METADATA[u_name]
        bahia_brs.append({
            "id": u["id"],
            "name": u_name,
            "nrs": meta["nrs_parent"],
            "macroregion": meta["macroregion"]
        })

    print("Gravando lib/territory-data.ts...")
    ts_code = []
    ts_code.append("// ==============================================================================")
    ts_code.append("// CIMBAHIA - DADOS TERRITORIAIS OFICIAIS DO ESTADO DA BAHIA")
    ts_code.append("// Fonte Oficial: data/municipios_completo.xlsx (417 Municípios, 28 BRS/NRS, 9 Macrorregiões)")
    ts_code.append("// Dados cadastrais de contato e farmacêuticos zerados para cadastro manual")
    ts_code.append("// ==============================================================================\n")
    ts_code.append('import { Municipio, Unit } from "./types";\n')

    ts_code.append("export const BAHIA_MACRORREGIOES: string[] = [")
    for macro in sorted(list(set(m["macroregion"] for m in all_municipios))):
        ts_code.append(f'  "{macro}",')
    ts_code.append("];\n")

    ts_code.append("export const BAHIA_NRS: Array<{ id: string; code: string; name: string; macroregion: string }> = " + json.dumps(NRS_LIST, ensure_ascii=False, indent=2) + ";\n")

    ts_code.append("export const BAHIA_BRS: Array<{ id: string; name: string; nrs: string; macroregion: string }> = " + json.dumps(bahia_brs, ensure_ascii=False, indent=2) + ";\n")

    ts_code.append("// Mapeamento dos 417 municípios no formato oficial do modelo de domínio do CimBahia")
    ts_code.append("export const INITIAL_BAHIA_MUNICIPIOS: Municipio[] = " + json.dumps(all_municipios, ensure_ascii=False, indent=2) + ";\n")

    ts_code.append("// Mapeamento oficial das 28 Unidades Regionais de Saúde (19 BRS + 9 NRS Sedes) da SESAB com contatos zerados para inserção manual")
    ts_code.append("export const OFFICIAL_BAHIA_UNITS: Unit[] = " + json.dumps(official_units, ensure_ascii=False, indent=2) + ";\n")

    ts_code.append("export const ALL_BAHIA_MUNICIPIOS: Municipio[] = INITIAL_BAHIA_MUNICIPIOS;\n")

    with open("lib/territory-data.ts", "w", encoding="utf-8") as out_ts:
        out_ts.write("\n".join(ts_code))

    print("lib/territory-data.ts gravado com sucesso com dados zerados!")

    # Gerar SQL seed zerado para o Supabase
    print("Gerando supabase/seed-28-units-bahia.sql...")
    sql_lines = []
    sql_lines.append("-- ==============================================================================")
    sql_lines.append("-- CIMBAHIA: SEED DE TODAS AS 28 UNIDADES / BASES REGIONAIS DE SAÚDE DA BAHIA")
    sql_lines.append("-- Dados cadastrais de contato zerados para preenchimento manual")
    sql_lines.append("-- Tabela: public.units")
    sql_lines.append("-- ==============================================================================\n")

    sql_lines.append("INSERT INTO public.units (id, name, macroregion, municipality, email, phone, address, active)")
    sql_lines.append("VALUES")

    val_clauses = []
    for u in official_units:
        uid = u["id"]
        uname = u["name"].replace("'", "''")
        macro = u["macroregion"].replace("'", "''")
        mun = u["municipality"].replace("'", "''")
        val_clauses.append(f"  ('{uid}', '{uname}', '{macro}', '{mun}', '', '', '', true)")

    sql_lines.append(",\n".join(val_clauses))
    sql_lines.append("ON CONFLICT (id) DO UPDATE SET")
    sql_lines.append("  name = EXCLUDED.name,")
    sql_lines.append("  macroregion = EXCLUDED.macroregion,")
    sql_lines.append("  municipality = EXCLUDED.municipality,")
    sql_lines.append("  email = EXCLUDED.email,")
    sql_lines.append("  phone = EXCLUDED.phone,")
    sql_lines.append("  address = EXCLUDED.address,")
    sql_lines.append("  active = true;\n")

    with open("supabase/seed-28-units-bahia.sql", "w", encoding="utf-8") as sql_out:
        sql_out.write("\n".join(sql_lines))

    print("supabase/seed-28-units-bahia.sql gravado com sucesso!")

if __name__ == "__main__":
    main()
