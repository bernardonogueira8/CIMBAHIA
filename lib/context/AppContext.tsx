"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  Unit,
  Profile,
  CID,
  Medication,
  OtherMedication,
  TipoParecer,
  Patient,
  Consultation,
  MonthlyComplementaryData,
  Role,
  Origem,
  Dires,
  Nucleo,
  BaseRegional,
  Municipio,
  Processo,
  ProcessoStatus,
  Parecer,
  ParecerVersao,
  Farmaco,
  isProcessoInFirstStatus,
} from "../types";
import { INITIAL_FARMACOS } from "../farmacos-data";
import {
  INITIAL_UNITS,
  INITIAL_PROFILES,
  INITIAL_MEDICATIONS,
  INITIAL_OTHER_MEDICATIONS,
  INITIAL_TIPOS_PARECER,
  INITIAL_PATIENTS,
  INITIAL_CONSULTATIONS,
  INITIAL_MONTHLY_DATA,
  INITIAL_ORIGENS,
  INITIAL_DIRES,
  INITIAL_NUCLEOS,
  INITIAL_BASES,
  INITIAL_MUNICIPIOS,
  INITIAL_PROCESSOS,
} from "../mock-data";
import { supabase, isSupabaseConfigured } from "../supabase/client";

function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface AppContextType {
  units: Unit[];
  profiles: Profile[];
  cids: CID[];
  medications: Medication[];
  patients: Patient[];
  consultations: Consultation[];
  monthlyData: MonthlyComplementaryData[];
  currentUser: Profile | null;
  isAuthenticated: boolean;
  authChecked: boolean;
  selectedUnitId: string; // "all" or specific unit id
  activeUnit: Unit | null;
  selectedUnit: Unit | null;
  canEdit: boolean;
  canManageCatalogs: boolean;
  isViewingOtherUnit: boolean;
  isSupabaseOnline: boolean;
  isSyncing: boolean;
  refreshFromSupabase: () => Promise<void>;
  isDemoMode: boolean;
  loginWithCredentials: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  enterDemoMode: (profileId: string) => void;
  logout: () => Promise<void>;
  setCurrentUser: (user: Profile | null) => void;
  setSelectedUnitId: (unitId: string) => void;
  addPatient: (patient: Omit<Patient, "id" | "created_at">) => Patient;
  updatePatient: (id: string, patient: Partial<Patient>) => void;
  addConsultation: (consultation: Omit<Consultation, "id" | "created_at">) => Consultation;
  updateConsultation: (
    consultationId: string,
    data: Partial<Omit<Consultation, "id">>
  ) => Promise<{ success: boolean; error?: string }>;
  updateMonthlyData: (data: Omit<MonthlyComplementaryData, "id" | "updated_at">) => void;
  addCID: (cid: Omit<CID, "id">) => Promise<CID>;
  updateCID: (
    cidId: string,
    cidData: Partial<Omit<CID, "id">>
  ) => Promise<{ success: boolean; error?: string }>;
  toggleCIDActive: (
    cidId: string,
    active: boolean
  ) => Promise<{ success: boolean; error?: string }>;
  addMedication: (med: Omit<Medication, "id">) => Promise<Medication>;
  updateMedication: (
    medId: string,
    medData: Partial<Omit<Medication, "id">>
  ) => Promise<{ success: boolean; error?: string }>;
  toggleMedicationActive: (
    medId: string,
    active: boolean
  ) => Promise<{ success: boolean; error?: string }>;
  addUnit: (unit: Omit<Unit, "id">) => Promise<Unit>;
  updateUnit: (
    unitId: string,
    unitData: Partial<Omit<Unit, "id">>
  ) => Promise<{ success: boolean; error?: string }>;
  updateUser: (
    userId: string,
    userData: {
      full_name?: string;
      email?: string;
      crf?: string | null;
      unit_id?: string | null;
      role?: Role;
      password?: string;
      active?: boolean;
    }
  ) => Promise<{ success: boolean; error?: string }>;
  toggleUserActive: (
    userId: string,
    active: boolean
  ) => Promise<{ success: boolean; error?: string }>;
  importSIGTAPData: (
    newCids: Omit<CID, "id">[],
    newMeds: Omit<Medication, "id">[]
  ) => { cidsAdded: number; medsAdded: number };
  clearSimulatedData: () => void;
  restoreDemoData: () => void;
  registerUser: (userData: {
    full_name: string;
    email: string;
    password: string;
    crf?: string;
    unit_id?: string | null;
    role: Role;
  }) => Promise<{ success: boolean; error?: string }>;

  // CIMBAHIA: Estrutura Territorial, Catálogos e Processos
  origens: Origem[];
  diresList: Dires[];
  nucleos: Nucleo[];
  bases: BaseRegional[];
  municipios: Municipio[];
  farmacos: Farmaco[];
  addFarmaco: (farmaco: Omit<Farmaco, "id">) => Promise<Farmaco>;
  updateFarmaco: (id: string, data: Partial<Farmaco>) => Promise<void>;
  toggleFarmacoActive: (id: string, active: boolean) => Promise<void>;
  deleteFarmaco: (id: string) => Promise<void>;
  otherMedications: OtherMedication[];
  tiposParecer: TipoParecer[];
  processos: Processo[];

  addOrigem: (origem: Omit<Origem, "id">) => Promise<Origem>;
  updateOrigem: (id: string, data: Partial<Origem>) => Promise<void>;
  deleteOrigem: (id: string) => Promise<void>;

  addDires: (dires: Omit<Dires, "id">) => Promise<Dires>;
  updateDires: (id: string, data: Partial<Dires>) => Promise<void>;
  deleteDires: (id: string) => Promise<void>;

  addNucleo: (nucleo: Omit<Nucleo, "id">) => Promise<Nucleo>;
  updateNucleo: (id: string, data: Partial<Nucleo>) => Promise<void>;
  deleteNucleo: (id: string) => Promise<void>;

  addMunicipio: (mun: Omit<Municipio, "id">) => Promise<Municipio>;
  updateMunicipio: (id: string, data: Partial<Municipio>) => Promise<void>;
  deleteMunicipio: (id: string) => Promise<void>;

  addOtherMedication: (med: Omit<OtherMedication, "id" | "created_at">) => Promise<OtherMedication>;
  updateOtherMedication: (id: string, data: Partial<OtherMedication>) => Promise<void>;
  toggleOtherMedicationActive: (id: string, active: boolean) => Promise<void>;

  addTipoParecer: (tp: Omit<TipoParecer, "id">) => Promise<TipoParecer>;
  updateTipoParecer: (id: string, data: Partial<TipoParecer>) => Promise<void>;
  toggleTipoParecerActive: (id: string, active: boolean) => Promise<void>;

  importCIDsBatch: (cids: Array<{ code: string; description: string; chapter?: string; group_name?: string }>) => Promise<{ addedCount: number; updatedCount: number }>;

  updateUnitFull: (id: string, data: Partial<Unit>) => Promise<void>;

  addProcesso: (proc: Omit<Processo, "id" | "created_at">) => Promise<Processo>;
  updateProcesso: (id: string, data: Partial<Processo>) => Promise<void>;
  deleteProcesso: (id: string) => Promise<{ success: boolean; error?: string }>;
  transicionarProcessoStatus: (processoId: string, newStatus: ProcessoStatus, notes?: string) => Promise<void>;
  atribuirFarmaceuticoProcesso: (processoId: string, pharmacistId: string) => Promise<void>;
  emitirParecerProcesso: (
    processoId: string,
    parecerData: {
      tipo_parecer_id: string;
      tipo_parecer_title: string;
      regulatory_effect: TipoParecer["regulatory_effect"];
      technical_justification: string;
      clinical_foundation: string;
      recommendations?: string | null;
    }
  ) => Promise<void>;
  retificarParecerProcesso: (
    processoId: string,
    parecerData: {
      tipo_parecer_id: string;
      tipo_parecer_title: string;
      regulatory_effect: TipoParecer["regulatory_effect"];
      technical_justification: string;
      clinical_foundation: string;
      recommendations?: string | null;
    },
    rectificationReason: string
  ) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY_PREFIX = "cimbahia_";

function getStoredOrDefault<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const item = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    return item === null ? defaultValue : JSON.parse(item);
  } catch {
    return defaultValue;
  }
}

function removeStoredItem(key: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY_PREFIX + key);
}

function saveToStorage<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.error("Failed to save to localStorage", e);
  }
}

function isValidUUID(val: string | null | undefined): boolean {
  if (!val) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
}

function mergeOfficialUnits(remoteUnits: Unit[]): Unit[] {
  const merged: Unit[] = INITIAL_UNITS.map((u) => ({
    ...u,
    email: "",
    phone: "",
    address: "",
    served_municipalities: [...(u.served_municipalities || [])],
    responsible_pharmacists: [],
  }));

  if (!remoteUnits || remoteUnits.length === 0) return merged;

  remoteUnits.forEach((remote) => {
    const remoteNameClean = (remote.name || "").trim().toLowerCase();
    const idx = merged.findIndex(
      (m) =>
        m.id === remote.id ||
        (m.name || "").trim().toLowerCase() === remoteNameClean
    );

    if (idx >= 0) {
      merged[idx] = {
        ...merged[idx],
        ...remote,
        email: remote.email || "",
        phone: remote.phone || "",
        address: remote.address || "",
        served_municipalities:
          remote.served_municipalities && remote.served_municipalities.length > 0
            ? remote.served_municipalities
            : merged[idx].served_municipalities,
        responsible_pharmacists: remote.responsible_pharmacists || [],
      };
    } else {
      merged.push({
        ...remote,
        served_municipalities: remote.served_municipalities || [],
        responsible_pharmacists: remote.responsible_pharmacists || [],
      });
    }
  });

  return merged;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [units, setUnits] = useState<Unit[]>(() => {
    if (typeof window !== "undefined") {
      try {
        removeStoredItem("units");
      } catch {}
    }
    const stored = getStoredOrDefault<Unit[]>("units_v3", INITIAL_UNITS);
    return mergeOfficialUnits(stored || []);
  });
  const [profiles, setProfiles] = useState<Profile[]>(() =>
    getStoredOrDefault("profiles", INITIAL_PROFILES)
  );
  const [cids, setCids] = useState<CID[]>([]);
  const [medications, setMedications] = useState<Medication[]>(() =>
    getStoredOrDefault("medications", INITIAL_MEDICATIONS)
  );
  const [patients, setPatients] = useState<Patient[]>(() => {
    const isDemo = getStoredOrDefault("isDemoMode", false);
    return isDemo ? INITIAL_PATIENTS : getStoredOrDefault("patients", []);
  });
  const [consultations, setConsultations] = useState<Consultation[]>(() => {
    const isDemo = getStoredOrDefault("isDemoMode", false);
    return isDemo ? INITIAL_CONSULTATIONS : getStoredOrDefault("consultations", []);
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyComplementaryData[]>(() => {
    const isDemo = getStoredOrDefault("isDemoMode", false);
    return isDemo ? INITIAL_MONTHLY_DATA : getStoredOrDefault("monthlyData", []);
  });

  // CimBahia: Estados territoriais, catálogos e processos
  const [origens, setOrigens] = useState<Origem[]>(() =>
    getStoredOrDefault("origens", INITIAL_ORIGENS)
  );
  const [diresList, setDiresList] = useState<Dires[]>(() =>
    getStoredOrDefault("diresList", INITIAL_DIRES)
  );
  const [nucleos, setNucleos] = useState<Nucleo[]>(() => {
    const stored = getStoredOrDefault<Nucleo[]>("nucleos", INITIAL_NUCLEOS);
    return stored && stored.length >= 9 ? stored : INITIAL_NUCLEOS;
  });
  const [bases, setBases] = useState<BaseRegional[]>(() => {
    const stored = getStoredOrDefault<BaseRegional[]>("bases", INITIAL_BASES);
    return stored && stored.length >= 28 ? stored : INITIAL_BASES;
  });
  const [municipios, setMunicipios] = useState<Municipio[]>(() => {
    const stored = getStoredOrDefault<Municipio[]>("municipios", INITIAL_MUNICIPIOS);
    return stored && stored.length >= 417 ? stored : INITIAL_MUNICIPIOS;
  });
  const [farmacos, setFarmacos] = useState<Farmaco[]>(() => {
    const stored = getStoredOrDefault<Farmaco[]>("farmacos", INITIAL_FARMACOS);
    return stored && stored.length >= 4000 ? stored : INITIAL_FARMACOS;
  });
  const [otherMedications, setOtherMedications] = useState<OtherMedication[]>(() =>
    getStoredOrDefault("otherMedications", INITIAL_OTHER_MEDICATIONS)
  );
  const [tiposParecer, setTiposParecer] = useState<TipoParecer[]>(() =>
    getStoredOrDefault("tiposParecer", INITIAL_TIPOS_PARECER)
  );
  const [processos, setProcessos] = useState<Processo[]>(() => {
    if (typeof window === "undefined") return INITIAL_PROCESSOS;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PREFIX + "processos");
      if (stored) {
        const parsed: Processo[] = JSON.parse(stored);
        const filtered = parsed.filter(
          (p) => !["proc-1", "proc-2", "proc-3", "proc-4", "proc-5"].includes(p.id)
        );
        if (filtered.length !== parsed.length) {
          localStorage.setItem(STORAGE_KEY_PREFIX + "processos", JSON.stringify(filtered));
        }
        return filtered;
      }
      return INITIAL_PROCESSOS;
    } catch {
      return INITIAL_PROCESSOS;
    }
  });

  const [isSupabaseOnline, setIsSupabaseOnline] = useState<boolean>(isSupabaseConfigured);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  // Usuário ativo no sistema (inicia de forma consistente com SSR e é verificado em initAuthAndSync)
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const [authChecked, setAuthChecked] = useState<boolean>(false);

  // Unidade sendo visualizada (padrão a própria unidade do usuário ou 'all' para administradores)
  const [selectedUnitId, setSelectedUnitId] = useState<string>("all");

  // Sincronização e Carga de dados a partir do Supabase
  const refreshFromSupabase = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      setIsSyncing(true);

      // 1. Unidades, CIDs, Medicamentos e Profiles (Metadados públicos/cadastrais de referência)
      const [
        cbUnitsRes,
        medsRes,
        relsRes,
        cbProfilesRes,
        origensRes,
        tiposRes,
        otherMedsRes,
      ] = await Promise.all([
        supabase.from("cb_units").select("*").order("name"),
        supabase.from("medications").select("*").order("name"),
        supabase.from("medication_authorized_cids").select("sigtap_code, cid_code"),
        supabase.from("cb_profiles").select("*"),
        supabase.from("cb_origens").select("*").order("name"),
        supabase.from("cb_tipos_parecer").select("*").order("title"),
        supabase.from("cb_other_medications").select("*").order("name"),
      ]);

      if (cbUnitsRes.data && cbUnitsRes.data.length > 0) {
        setUnits(mergeOfficialUnits(cbUnitsRes.data));
      } else {
        const fallbackUnits = await supabase.from("units").select("*").order("name");
        if (fallbackUnits.data && fallbackUnits.data.length > 0) {
          setUnits(mergeOfficialUnits(fallbackUnits.data));
        }
      }

      const cidsFromDatabase: CID[] = [];
      for (let start = 0; ; start += 1000) {
        const { data, error } = await supabase
          .from("cb_cids")
          .select("*")
          .order("code")
          .range(start, start + 999);

        if (error) {
          console.error("Erro ao carregar CIDs de cb_cids:", error.message);
          cidsFromDatabase.length = 0;
          break;
        }

        cidsFromDatabase.push(...(data || []));
        if (!data || data.length < 1000) break;
      }
      setCids(cidsFromDatabase);

      if (cbProfilesRes.data && cbProfilesRes.data.length > 0) {
        setProfiles(cbProfilesRes.data);
      } else {
        const fallbackProfiles = await supabase.from("profiles").select("*");
        if (fallbackProfiles.data && fallbackProfiles.data.length > 0) {
          setProfiles(fallbackProfiles.data);
        }
      }

      if (origensRes.data && origensRes.data.length > 0) {
        setOrigens(origensRes.data);
      }

      if (tiposRes.data && tiposRes.data.length > 0) {
        setTiposParecer(tiposRes.data);
      }

      if (otherMedsRes.data && otherMedsRes.data.length > 0) {
        setOtherMedications(otherMedsRes.data);
      }

      // Mapeamento de CIDs compatíveis nos medicamentos
      if (medsRes.data && medsRes.data.length > 0) {
        const relMap = new Map<string, string[]>();
        if (relsRes.data) {
          relsRes.data.forEach((r: { sigtap_code: string; cid_code: string }) => {
            if (!relMap.has(r.sigtap_code)) {
              relMap.set(r.sigtap_code, []);
            }
            relMap.get(r.sigtap_code)!.push(r.cid_code);
          });
        }

        const hydratedMeds: Medication[] = medsRes.data.map((m: any) => ({
          ...m,
          compatible_cid_codes: m.sigtap_code ? relMap.get(m.sigtap_code) || [] : [],
        }));
        setMedications(hydratedMeds);
      }

      // 2. Dados Operacionais do CimBahia (Pacientes e Processos SEI da tabela cb_*)
      const isDemo = getStoredOrDefault("isDemoMode", false);
      if (!isDemo) {
        const { data: patsData } = await supabase
          .from("cb_patients")
          .select("*")
          .order("full_name");
        if (patsData && patsData.length > 0) {
          setPatients(patsData);
        }

        const { data: procsData } = await supabase
          .from("cb_processos")
          .select(`
            *,
            items:cb_processo_items (*),
            pareceres:cb_pareceres (
              *,
              versoes:cb_parecer_versoes (*)
            ),
            historico:cb_processo_historico (*)
          `)
          .order("created_at", { ascending: false });

        if (procsData && procsData.length > 0) {
          const mappedProcs: Processo[] = procsData.map((row: any) => {
            let activeParecer: Parecer | undefined = undefined;
            if (row.pareceres && row.pareceres.length > 0) {
              const p = row.pareceres[0];
              const sortedVersoes: ParecerVersao[] = (p.versoes || []).sort(
                (a: any, b: any) => b.version_number - a.version_number
              );
              if (sortedVersoes.length > 0) {
                activeParecer = {
                  id: p.id,
                  processo_id: row.id,
                  active_version: sortedVersoes[0],
                  versions_history: sortedVersoes.slice(1),
                };
              }
            }

            return {
              ...row,
              items: row.items || [],
              parecer: activeParecer,
              historico: (row.historico || []).sort(
                (a: any, b: any) =>
                  new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
              ),
            };
          });
          setProcessos(mappedProcs);
        }
      }

      setIsSupabaseOnline(true);
    } catch (err) {
      console.warn("Erro ao sincronizar dados com o Supabase:", err);
      setCids([]);
      setIsSupabaseOnline(false);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Monitora e inicializa autenticação e sessão com Supabase
  useEffect(() => {
    let active = true;

    const initAuthAndSync = async () => {
      try {
        const isDemo = getStoredOrDefault("isDemoMode", false);
        if (isDemo) {
          const storedUser = getStoredOrDefault<Profile | null>("currentUser", null);
          const demoUser = storedUser || INITIAL_PROFILES[0];
          if (active) {
            setIsDemoMode(true);
            setCurrentUser(demoUser);
            setIsAuthenticated(true);
            setPatients(INITIAL_PATIENTS);
            setConsultations(INITIAL_CONSULTATIONS);
            setMonthlyData(INITIAL_MONTHLY_DATA);
            if (demoUser.unit_id) setSelectedUnitId(demoUser.unit_id);
            setAuthChecked(true);
          }
          return;
        }

        // Modo Real: Verifica sessão real do Supabase
        if (isSupabaseConfigured && supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user?.email) {
            let { data: dbProfile } = await supabase
              .from("cb_profiles")
              .select("*, unit:cb_units(*)")
              .eq("email", session.user.email)
              .maybeSingle();

            if (!dbProfile) {
              const { data: legacyProfile } = await supabase
                .from("profiles")
                .select("*, unit:units(*)")
                .eq("email", session.user.email)
                .maybeSingle();
              if (legacyProfile) {
                dbProfile = legacyProfile;
                // Sincroniza cópia isolada na tabela cb_profiles
                await supabase.from("cb_profiles").upsert({
                  id: legacyProfile.id,
                  full_name: legacyProfile.full_name,
                  email: legacyProfile.email,
                  crf: legacyProfile.crf || null,
                  unit_id: isValidUUID(legacyProfile.unit_id) ? legacyProfile.unit_id : null,
                  role: legacyProfile.role || "pharmacist",
                  active: legacyProfile.active ?? true,
                });
              }
            }

            if (active && dbProfile) {
              if (dbProfile.active === false) {
                await supabase.auth.signOut();
                setIsDemoMode(false);
                setCurrentUser(null);
                setIsAuthenticated(false);
                setPatients([]);
                setConsultations([]);
                setMonthlyData([]);
                setAuthChecked(true);
                return;
              }

              setIsDemoMode(false);
              setCurrentUser(dbProfile);
              setIsAuthenticated(true);
              if (dbProfile.unit_id) {
                setSelectedUnitId(dbProfile.unit_id);
              } else {
                setSelectedUnitId("all");
              }
              await refreshFromSupabase();
              setAuthChecked(true);
              return;
            }
          }
        }

        // Sem sessão e não-demo (ou Supabase não configurado): verifica usuário salvo em localStorage
        if (!isSupabaseConfigured || !supabase) {
          const storedUser = getStoredOrDefault<Profile | null>("currentUser", null);
          if (active && storedUser) {
            setIsDemoMode(false);
            setCurrentUser(storedUser);
            setIsAuthenticated(true);
            if (storedUser.unit_id) setSelectedUnitId(storedUser.unit_id);
            setAuthChecked(true);
            return;
          }
        }

        // Sem sessão e não-demo: Deslogado e sem dados sensíveis
        if (active) {
          setIsDemoMode(false);
          setCurrentUser(null);
          setIsAuthenticated(false);
          setPatients([]);
          setConsultations([]);
          setMonthlyData([]);
          setAuthChecked(true);
        }
      } catch (err) {
        console.warn("Erro ao checar sessão:", err);
        if (active) {
          setIsDemoMode(false);
          setCurrentUser(null);
          setIsAuthenticated(false);
          setAuthChecked(true);
        }
      }
    };

    initAuthAndSync();

    return () => {
      active = false;
    };
  }, [refreshFromSupabase]);

  // Monitora alterações de estado do Supabase Auth
  useEffect(() => {
    const client = supabase;
    if (!isSupabaseConfigured || !client) return;

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange(async (event, session) => {
      const isDemo = getStoredOrDefault("isDemoMode", false);
      if (isDemo) return;

      if (event === "SIGNED_OUT" || !session) {
        setCurrentUser(null);
        setIsAuthenticated(false);
        setPatients([]);
        setConsultations([]);
        setMonthlyData([]);
      } else if (session?.user?.email) {
        let { data: dbProfile } = await client
          .from("cb_profiles")
          .select("*")
          .eq("email", session.user.email)
          .maybeSingle();

        if (!dbProfile) {
          const { data: legacyProfile } = await client
            .from("profiles")
            .select("*")
            .eq("email", session.user.email)
            .maybeSingle();
          dbProfile = legacyProfile;
        }

        if (dbProfile) {
          if (dbProfile.active === false) {
            await client.auth.signOut();
            setCurrentUser(null);
            setIsAuthenticated(false);
            setPatients([]);
            setConsultations([]);
            setMonthlyData([]);
            return;
          }

          setCurrentUser(dbProfile);
          setIsAuthenticated(true);
          setIsDemoMode(false);
          if (dbProfile.unit_id) {
            setSelectedUnitId(dbProfile.unit_id);
          }
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Efeitos para persistência em localStorage (fallback offline contínuo)
  useEffect(() => saveToStorage("units_v3", units), [units]);
  useEffect(() => saveToStorage("profiles", profiles), [profiles]);
  useEffect(() => saveToStorage("medications", medications), [medications]);
  useEffect(() => saveToStorage("origens", origens), [origens]);
  useEffect(() => saveToStorage("diresList", diresList), [diresList]);
  useEffect(() => saveToStorage("nucleos", nucleos), [nucleos]);
  useEffect(() => saveToStorage("bases", bases), [bases]);
  useEffect(() => saveToStorage("municipios", municipios), [municipios]);
  useEffect(() => saveToStorage("otherMedications", otherMedications), [otherMedications]);
  useEffect(() => saveToStorage("tiposParecer", tiposParecer), [tiposParecer]);
  useEffect(() => saveToStorage("processos", processos), [processos]);
  useEffect(() => {
    if (!authChecked) return;
    if (isDemoMode) {
      saveToStorage("patients", patients);
    }
  }, [patients, isDemoMode, authChecked]);
  useEffect(() => {
    if (!authChecked) return;
    if (isDemoMode) {
      saveToStorage("consultations", consultations);
    }
  }, [consultations, isDemoMode, authChecked]);
  useEffect(() => {
    if (!authChecked) return;
    if (isDemoMode) {
      saveToStorage("monthlyData", monthlyData);
    }
  }, [monthlyData, isDemoMode, authChecked]);
  useEffect(() => {
    if (!authChecked) return;
    saveToStorage("currentUser", currentUser);
  }, [currentUser, authChecked]);
  useEffect(() => {
    if (!authChecked) return;
    saveToStorage("isDemoMode", isDemoMode);
  }, [isDemoMode, authChecked]);

  const enterDemoMode = (profileId: string) => {
    const prof =
      profiles.find(
        (p) =>
          p.id === profileId ||
          p.email.toLowerCase() === profileId.toLowerCase() ||
          (profileId === "u-001" && p.email.includes("juliana")) ||
          (profileId === "u-002" && p.email.includes("rodrigo")) ||
          (profileId === "u-003" && p.email.includes("mariana"))
      ) || INITIAL_PROFILES[0];

    setIsDemoMode(true);
    saveToStorage("isDemoMode", true);
    setCurrentUser(prof);
    setIsAuthenticated(true);
    saveToStorage("currentUser", prof);

    setPatients(INITIAL_PATIENTS);
    setConsultations(INITIAL_CONSULTATIONS);
    setMonthlyData(INITIAL_MONTHLY_DATA);

    if (prof.unit_id) {
      setSelectedUnitId(prof.unit_id);
    } else {
      setSelectedUnitId("all");
    }
  };

  const loginWithCredentials = async (
    emailInput: string,
    passwordInput: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!isSupabaseConfigured || !supabase) {
        const matchedProfile = profiles.find(
          (p) => p.email.toLowerCase() === emailInput.trim().toLowerCase()
        );
        if (!matchedProfile) {
          return { success: false, error: "E-mail não encontrado no cadastro local." };
        }
        if (matchedProfile.active === false) {
          return {
            success: false,
            error: "Acesso bloqueado: Este usuário foi inativado pela Administração. Entre em contato com a gestão.",
          };
        }
        setIsDemoMode(false);
        saveToStorage("isDemoMode", false);
        setCurrentUser(matchedProfile);
        setIsAuthenticated(true);
        saveToStorage("currentUser", matchedProfile);
        if (matchedProfile.unit_id) setSelectedUnitId(matchedProfile.unit_id);
        return { success: true };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailInput.trim(),
        password: passwordInput,
      });

      if (error) {
        return {
          success: false,
          error: error.message.includes("Invalid login credentials")
            ? "Credenciais inválidas. Verifique seu e-mail e senha cadastrados no Supabase."
            : `Erro de autenticação: ${error.message}`,
        };
      }

      if (data.user) {
        let { data: dbProfile } = await supabase
          .from("cb_profiles")
          .select("*, unit:cb_units(*)")
          .eq("email", data.user.email)
          .maybeSingle();

        if (!dbProfile) {
          const { data: legacyProfile } = await supabase
            .from("profiles")
            .select("*, unit:units(*)")
            .eq("email", data.user.email)
            .maybeSingle();
          if (legacyProfile) {
            dbProfile = legacyProfile;
            await supabase.from("cb_profiles").upsert({
              id: legacyProfile.id,
              full_name: legacyProfile.full_name,
              email: legacyProfile.email,
              crf: legacyProfile.crf || null,
              unit_id: isValidUUID(legacyProfile.unit_id) ? legacyProfile.unit_id : null,
              role: legacyProfile.role || "pharmacist",
              active: legacyProfile.active ?? true,
            });
          }
        }

        if (dbProfile && dbProfile.active === false) {
          await supabase.auth.signOut();
          return {
            success: false,
            error: "Acesso bloqueado: Este usuário foi inativado pela Administração. Entre em contato com a gestão.",
          };
        }

        let activeProfile: Profile;
        if (dbProfile) {
          activeProfile = dbProfile;
        } else {
          const userMeta = data.user.user_metadata || {};
          activeProfile = {
            id: data.user.id,
            full_name:
              userMeta.full_name ||
              data.user.email?.split("@")[0].replace(".", " ") ||
              "Usuário Institucional",
            email: data.user.email!,
            crf: userMeta.crf || null,
            unit_id: isValidUUID(userMeta.unit_id) ? userMeta.unit_id : null,
            role: userMeta.role || "pharmacist",
          };
          await supabase.from("cb_profiles").upsert({
            id: activeProfile.id,
            full_name: activeProfile.full_name,
            email: activeProfile.email,
            crf: activeProfile.crf || null,
            unit_id: activeProfile.unit_id || null,
            role: activeProfile.role || "pharmacist",
            active: true,
          });
        }

        setIsDemoMode(false);
        saveToStorage("isDemoMode", false);
        setCurrentUser(activeProfile);
        setIsAuthenticated(true);
        saveToStorage("currentUser", activeProfile);

        if (activeProfile.unit_id) {
          setSelectedUnitId(activeProfile.unit_id);
        } else {
          setSelectedUnitId("all");
        }

        await refreshFromSupabase();
        return { success: true };
      }

      return { success: false, error: "Usuário autenticado não localizado." };
    } catch (err: any) {
      return { success: false, error: err?.message || "Erro inesperado ao realizar login." };
    }
  };

  const logout = async () => {
    const client = supabase;
    if (client) {
      try {
        await client.auth.signOut();
      } catch (err) {
        console.warn("SignOut error:", err);
      }
    }
    if (typeof window !== "undefined") {
      removeStoredItem("currentUser");
      removeStoredItem("isDemoMode");
      removeStoredItem("patients");
      removeStoredItem("consultations");
      removeStoredItem("monthlyData");
    }
    setIsDemoMode(false);
    setCurrentUser(null);
    setIsAuthenticated(false);
    setPatients([]);
    setConsultations([]);
    setMonthlyData([]);
  };

  // Unidade do usuário logado
  const activeUnit = currentUser
    ? units.find((u) => u.id === currentUser.unit_id) || null
    : null;

  // Unidade selecionada para visualização
  const selectedUnit =
    selectedUnitId === "all" ? null : units.find((u) => u.id === selectedUnitId) || null;

  // Regra de Ouro: Admin tem permissão total.
  // Usuário comum só tem permissão de escrita se estiver na sua própria unidade.
  const canEdit = Boolean(
    currentUser &&
      (currentUser.role === "admin" ||
        (Boolean(currentUser.unit_id) && currentUser.unit_id === selectedUnitId))
  );

  // Se o usuário está inspecionando uma unidade que não é a dele (e não é admin)
  const isViewingOtherUnit = Boolean(
    currentUser &&
      currentUser.role !== "admin" &&
      selectedUnitId !== "all" &&
      currentUser.unit_id !== selectedUnitId
  );

  // Mutação: Adicionar Paciente (Gravado no Supabase + Cache Local)
  const addPatient = (patientData: Omit<Patient, "id" | "created_at">): Patient => {
    const newId = generateUUID();
    const newPatient: Patient = {
      ...patientData,
      id: newId,
      created_at: new Date().toISOString(),
    };

    setPatients((prev) => [newPatient, ...prev]);

    if (!isDemoMode && isSupabaseConfigured && supabase) {
      supabase
        .from("cb_patients")
        .insert({
          id: newPatient.id,
          unit_id: isValidUUID(newPatient.unit_id) ? newPatient.unit_id : null,
          cpf: newPatient.cpf || null,
          cpf_not_provided: newPatient.cpf_not_provided ?? false,
          cns: newPatient.cns || null,
          full_name: newPatient.full_name,
          birth_date: newPatient.birth_date || null,
          gender: newPatient.gender || null,
          phone: newPatient.phone || null,
          bairro: newPatient.bairro || null,
          cep: newPatient.cep || null,
          municipality_id: isValidUUID(newPatient.municipality_id) ? newPatient.municipality_id : null,
          municipality_name: newPatient.municipality_name || null,
          is_outside_bahia: newPatient.is_outside_bahia ?? false,
          outside_state_description: newPatient.outside_state_description || null,
          status: newPatient.status,
          status_externo: newPatient.status_externo || null,
          afsesab_status: newPatient.afsesab_status || null,
          afsesab_status_label: newPatient.afsesab_status_label || null,
          cadastrado_afsesab: newPatient.cadastrado_afsesab ?? false,
          created_by: isValidUUID(currentUser?.id) ? currentUser!.id : null,
        })
        .then(({ error }) => {
          if (error) console.warn("Supabase cb_patients insert warning:", error.message);
        });
    }

    return newPatient;
  };

  const updatePatient = (id: string, patch: Partial<Patient>) => {
    setPatients((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, ...patch, updated_at: new Date().toISOString() } : p
      )
    );

    if (!isDemoMode && isSupabaseConfigured && supabase) {
      const sanitizedPatch: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (patch.full_name !== undefined) sanitizedPatch.full_name = patch.full_name;
      if (patch.cpf !== undefined) sanitizedPatch.cpf = patch.cpf;
      if (patch.cpf_not_provided !== undefined) sanitizedPatch.cpf_not_provided = patch.cpf_not_provided;
      if (patch.cns !== undefined) sanitizedPatch.cns = patch.cns || null;
      if (patch.birth_date !== undefined) sanitizedPatch.birth_date = patch.birth_date || null;
      if (patch.gender !== undefined) sanitizedPatch.gender = patch.gender || null;
      if (patch.phone !== undefined) sanitizedPatch.phone = patch.phone || null;
      if (patch.bairro !== undefined) sanitizedPatch.bairro = patch.bairro || null;
      if (patch.cep !== undefined) sanitizedPatch.cep = patch.cep || null;
      if (patch.municipality_id !== undefined) sanitizedPatch.municipality_id = isValidUUID(patch.municipality_id) ? patch.municipality_id : null;
      if (patch.municipality_name !== undefined) sanitizedPatch.municipality_name = patch.municipality_name || null;
      if (patch.is_outside_bahia !== undefined) sanitizedPatch.is_outside_bahia = patch.is_outside_bahia;
      if (patch.outside_state_description !== undefined) sanitizedPatch.outside_state_description = patch.outside_state_description || null;
      if (patch.status !== undefined) sanitizedPatch.status = patch.status;
      if (patch.status_externo !== undefined) sanitizedPatch.status_externo = patch.status_externo || null;
      if (patch.afsesab_status !== undefined) sanitizedPatch.afsesab_status = patch.afsesab_status || null;
      if (patch.afsesab_status_label !== undefined) sanitizedPatch.afsesab_status_label = patch.afsesab_status_label || null;
      if (patch.cadastrado_afsesab !== undefined) sanitizedPatch.cadastrado_afsesab = patch.cadastrado_afsesab;

      supabase
        .from("cb_patients")
        .update(sanitizedPatch)
        .eq("id", id)
        .then(({ error }) => {
          if (error) console.warn("Supabase cb_patients update warning:", error.message);
        });
    }
  };

  // Mutação: Adicionar Atendimento / Consulta (Gravado no Supabase + Relacionamentos)
  const addConsultation = (
    data: Omit<Consultation, "id" | "created_at">
  ): Consultation => {
    const newId = generateUUID();
    const newConsultation: Consultation = {
      ...data,
      id: newId,
      created_at: new Date().toISOString(),
    };

    setConsultations((prev) => [newConsultation, ...prev]);

    const client = supabase;
    if (!isDemoMode && isSupabaseConfigured && client) {
      client
        .from("consultations")
        .insert({
          id: newConsultation.id,
          unit_id: newConsultation.unit_id,
          patient_id: newConsultation.patient_id,
          pharmacist_id:
            newConsultation.pharmacist_id && newConsultation.pharmacist_id.includes("-")
              ? newConsultation.pharmacist_id
              : currentUser?.id,
          consultation_date: newConsultation.consultation_date,
          primary_cid_id: newConsultation.primary_cid_id,
          is_pharmaceutical_guidance_only: newConsultation.is_pharmaceutical_guidance_only,
          is_new_patient: newConsultation.is_new_patient,
          interventions_count: newConsultation.interventions_count,
          pharmaceutical_discharge: newConsultation.pharmaceutical_discharge,
          clinical_notes: newConsultation.clinical_notes || null,
        })
        .then(async ({ error }) => {
          if (error) {
            console.error("Erro ao salvar consulta no Supabase:", error);
            return;
          }

          // Salva medicamentos avaliados
          if (newConsultation.medications && newConsultation.medications.length > 0) {
            const medRows = newConsultation.medications.map((m) => ({
              consultation_id: newConsultation.id,
              medication_id: m.id,
            }));
            await client.from("consultation_medications").insert(medRows);
          }

          // Salva PRFs identificados
          if (newConsultation.prfs && newConsultation.prfs.length > 0) {
            const prfRows = newConsultation.prfs.map((prf) => ({
              id: prf.id && prf.id.includes("-") ? prf.id : generateUUID(),
              consultation_id: newConsultation.id,
              medication_id:
                prf.medication_id && prf.medication_id.includes("-")
                  ? prf.medication_id
                  : null,
              category: prf.category,
              status: prf.status,
              description: prf.description || null,
            }));
            await client.from("consultation_prfs").insert(prfRows);
          }
        });
    }

    return newConsultation;
  };

  const updateConsultation = async (
    consultationId: string,
    data: Partial<Omit<Consultation, "id">>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setConsultations((prev) =>
        prev.map((c) => {
          if (c.id !== consultationId) return c;
          return {
            ...c,
            ...data,
            updated_at: new Date().toISOString(),
          };
        })
      );

      const client = supabase;
      if (!isDemoMode && isSupabaseConfigured && client) {
        const updatePayload: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };
        if (data.unit_id !== undefined) updatePayload.unit_id = data.unit_id;
        if (data.consultation_date !== undefined) updatePayload.consultation_date = data.consultation_date;
        if (data.pharmacist_id !== undefined) updatePayload.pharmacist_id = data.pharmacist_id;
        if (data.primary_cid_id !== undefined) updatePayload.primary_cid_id = data.primary_cid_id;
        if (data.is_pharmaceutical_guidance_only !== undefined)
          updatePayload.is_pharmaceutical_guidance_only = data.is_pharmaceutical_guidance_only;
        if (data.is_new_patient !== undefined) updatePayload.is_new_patient = data.is_new_patient;
        if (data.interventions_count !== undefined) updatePayload.interventions_count = data.interventions_count;
        if (data.pharmaceutical_discharge !== undefined)
          updatePayload.pharmaceutical_discharge = data.pharmaceutical_discharge;
        if (data.clinical_notes !== undefined) updatePayload.clinical_notes = data.clinical_notes;

        const { error } = await client
          .from("consultations")
          .update(updatePayload)
          .eq("id", consultationId);

        if (error) {
          console.error("Erro ao atualizar atendimento no Supabase:", error);
          return { success: false, error: error.message };
        }

        // Atualização dos PRFs (consultation_prfs) no Supabase
        if (data.prfs !== undefined) {
          const { error: prfDelError } = await client
            .from("consultation_prfs")
            .delete()
            .eq("consultation_id", consultationId);

          if (prfDelError) {
            console.error("Erro ao limpar PRFs anteriores:", prfDelError);
          }

          if (data.prfs && data.prfs.length > 0) {
            const prfRows = data.prfs.map((prf) => ({
              id:
                prf.id &&
                prf.id.includes("-") &&
                !prf.id.startsWith("prf-temp-") &&
                !prf.id.startsWith("prf-edit-") &&
                !prf.id.startsWith("prf-inherited-")
                  ? prf.id
                  : generateUUID(),
              consultation_id: consultationId,
              medication_id:
                prf.medication_id && prf.medication_id.includes("-")
                  ? prf.medication_id
                  : null,
              category: prf.category,
              status: prf.status,
              description: prf.description || null,
            }));
            const { error: prfInsError } = await client
              .from("consultation_prfs")
              .insert(prfRows);

            if (prfInsError) {
              console.error("Erro ao inserir PRFs atualizados:", prfInsError);
            }
          }
        }

        // Atualização de medicamentos avaliados (consultation_medications) se fornecido
        if (data.medications !== undefined) {
          const { error: medDelError } = await client
            .from("consultation_medications")
            .delete()
            .eq("consultation_id", consultationId);

          if (medDelError) {
            console.error("Erro ao limpar medicamentos da consulta:", medDelError);
          }

          if (data.medications && data.medications.length > 0) {
            const medRows = data.medications.map((m) => ({
              consultation_id: consultationId,
              medication_id: m.id,
            }));
            const { error: medInsError } = await client
              .from("consultation_medications")
              .insert(medRows);

            if (medInsError) {
              console.error("Erro ao inserir medicamentos da consulta:", medInsError);
            }
          }
        }
      }

      await refreshFromSupabase();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Erro inesperado ao atualizar atendimento." };
    }
  };

  const updateMonthlyData = (
    data: Omit<MonthlyComplementaryData, "id" | "updated_at">
  ) => {
    setMonthlyData((prev) => {
      const existingIndex = prev.findIndex(
        (m) => m.unit_id === data.unit_id && m.year === data.year && m.month === data.month
      );
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          ...data,
          updated_at: new Date().toISOString(),
        };
        return updated;
      } else {
        const newRecord: MonthlyComplementaryData = {
          ...data,
          id: generateUUID(),
          updated_at: new Date().toISOString(),
        };
        return [newRecord, ...prev];
      }
    });

    if (!isDemoMode && isSupabaseConfigured && supabase) {
      supabase
        .from("monthly_complementary_data")
        .upsert(
          {
            unit_id: data.unit_id,
            year: data.year,
            month: data.month,
            total_patients_in_followup: data.total_patients_in_followup,
            collective_health_activities: data.collective_health_activities,
            dispensing_administrative_patients: data.dispensing_administrative_patients,
            first_dispensing_by_pharmacist: data.first_dispensing_by_pharmacist,
            total_new_patients_month: data.total_new_patients_month,
            updated_by:
              currentUser?.id && currentUser.id.includes("-") ? currentUser.id : null,
          },
          { onConflict: "unit_id,year,month" }
        )
        .then(({ error }) => {
          if (error) console.error("Erro ao gravar dados complementares no Supabase:", error);
        });
    }
  };

  // Regra de Administração: apenas admin gerencia CIDs e Medicamentos
  const canManageCatalogs = Boolean(currentUser && currentUser.role === "admin");

  const addCID = async (cid: Omit<CID, "id">): Promise<CID> => {
    if (!canManageCatalogs) {
      throw new Error("Permissão negada: apenas administradores podem cadastrar CIDs.");
    }
    if (!isSupabaseConfigured || !supabase) {
      throw new Error("Supabase não configurado: não é possível cadastrar CIDs.");
    }
    const newId = generateUUID();
    const newCid: CID = {
      ...cid,
      code: cid.code.toUpperCase().trim(),
      id: newId,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("cb_cids").upsert(
      {
        code: newCid.code,
        description: newCid.description,
        chapter: newCid.chapter || null,
        group_name: newCid.group_name || null,
        active: newCid.active,
      },
      { onConflict: "code" }
    );
    if (error) {
      console.error("Erro ao salvar CID no Supabase:", error.message);
      throw new Error(error.message);
    }
    await refreshFromSupabase();

    return newCid;
  };

  const addMedication = async (med: Omit<Medication, "id">): Promise<Medication> => {
    if (!canManageCatalogs) {
      throw new Error("Permissão negada: apenas administradores podem cadastrar Medicamentos.");
    }
    const newId = generateUUID();
    const newMed: Medication = {
      ...med,
      component: "CEAF", // Exclusivamente CEAF
      id: newId,
      created_at: new Date().toISOString(),
    };
    setMedications((prev) => [newMed, ...prev]);

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from("medications").upsert(
          {
            sigtap_code: newMed.sigtap_code || null,
            name: newMed.name,
            pharmaceutical_form: newMed.pharmaceutical_form || null,
            component: "CEAF",
            active: newMed.active,
          },
          { onConflict: "sigtap_code" }
        );
        if (error) console.error("Erro ao salvar medicamento no Supabase:", error);
        await refreshFromSupabase();
      } catch (e) {
        console.error("Falha ao persistir medicamento:", e);
      }
    }

    return newMed;
  };

  const updateCID = async (
    cidId: string,
    cidData: Partial<Omit<CID, "id">>
  ): Promise<{ success: boolean; error?: string }> => {
    if (!canManageCatalogs) {
      return { success: false, error: "Permissão negada: apenas administradores podem editar CIDs." };
    }
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: "Supabase não configurado: não é possível editar CIDs." };
    }

    const updatePayload: Record<string, any> = {};
    if (cidData.code !== undefined) updatePayload.code = cidData.code.toUpperCase().trim();
    if (cidData.description !== undefined) updatePayload.description = cidData.description.trim();
    if (cidData.chapter !== undefined) updatePayload.chapter = cidData.chapter || null;
    if (cidData.group_name !== undefined) updatePayload.group_name = cidData.group_name || null;
    if (cidData.active !== undefined) updatePayload.active = cidData.active;

    const { error } = await supabase
      .from("cb_cids")
      .update(updatePayload)
      .eq("id", cidId);

    if (error) {
      console.error("Erro ao atualizar CID no Supabase:", error.message);
      return { success: false, error: error.message };
    }
    await refreshFromSupabase();
    return { success: true };
  };

  const toggleCIDActive = async (
    cidId: string,
    active: boolean
  ): Promise<{ success: boolean; error?: string }> => {
    return updateCID(cidId, { active });
  };

  const updateMedication = async (
    medId: string,
    medData: Partial<Omit<Medication, "id">>
  ): Promise<{ success: boolean; error?: string }> => {
    if (!canManageCatalogs) {
      return { success: false, error: "Permissão negada: apenas administradores podem editar medicamentos." };
    }

    setMedications((prev) =>
      prev.map((m) => (m.id === medId ? { ...m, ...medData } : m))
    );

    if (isSupabaseConfigured && supabase) {
      try {
        const updatePayload: Record<string, any> = {};
        if (medData.name !== undefined) updatePayload.name = medData.name.trim();
        if (medData.sigtap_code !== undefined) updatePayload.sigtap_code = medData.sigtap_code?.trim() || null;
        if (medData.pharmaceutical_form !== undefined)
          updatePayload.pharmaceutical_form = medData.pharmaceutical_form?.trim() || null;
        if (medData.active !== undefined) updatePayload.active = medData.active;

        const { error } = await supabase
          .from("medications")
          .update(updatePayload)
          .eq("id", medId);

        if (error) {
          console.error("Erro ao atualizar medicamento no Supabase:", error);
          return { success: false, error: error.message };
        }

        // Se foram informados novos PCDTs/CIDs autorizados
        if (medData.compatible_cid_codes !== undefined) {
          const currentMed = medications.find((m) => m.id === medId);
          const sigCode = (medData.sigtap_code ?? currentMed?.sigtap_code)?.trim();
          if (sigCode) {
            await supabase.from("medication_authorized_cids").delete().eq("sigtap_code", sigCode);
            if (medData.compatible_cid_codes.length > 0) {
              const relRows = medData.compatible_cid_codes.map((cCode, idx) => ({
                sigtap_code: sigCode,
                cid_code: cCode.trim().toUpperCase(),
                is_primary: idx === 0,
              }));
              await supabase.from("medication_authorized_cids").insert(relRows);
            }
          }
        }

        await refreshFromSupabase();
        return { success: true };
      } catch (e: any) {
        console.error("Falha ao atualizar medicamento:", e);
        return { success: false, error: e.message || "Erro ao atualizar medicamento." };
      }
    }

    return { success: true };
  };

  const toggleMedicationActive = async (
    medId: string,
    active: boolean
  ): Promise<{ success: boolean; error?: string }> => {
    return updateMedication(medId, { active });
  };

  const addUnit = async (unit: Omit<Unit, "id">): Promise<Unit> => {
    const newId = generateUUID();
    const newUnit: Unit = {
      ...unit,
      id: newId,
      created_at: new Date().toISOString(),
    };
    setUnits((prev) => [...prev, newUnit]);

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from("cb_units").insert({
          id: newUnit.id,
          name: newUnit.name,
          macroregion: newUnit.macroregion,
          cnes: newUnit.cnes || null,
          municipality: newUnit.municipality || null,
          email: newUnit.email || null,
          phone: newUnit.phone || null,
          address: newUnit.address || null,
          active: newUnit.active,
        });
        if (error) console.error("Erro ao salvar unidade no Supabase:", error);
        await refreshFromSupabase();
      } catch (e) {
        console.error("Falha ao persistir unidade:", e);
      }
    }

    return newUnit;
  };

  const updateUnit = async (
    unitId: string,
    unitData: Partial<Omit<Unit, "id">>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setUnits((prev) =>
        prev.map((u) => (u.id === unitId ? { ...u, ...unitData } : u))
      );

      if (isSupabaseConfigured && supabase && isValidUUID(unitId)) {
        const { error } = await supabase
          .from("cb_units")
          .update({
            ...unitData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", unitId);

        if (error) {
          console.error("Erro ao atualizar unidade no Supabase:", error);
          return { success: false, error: error.message };
        }
        await refreshFromSupabase();
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Erro ao atualizar unidade." };
    }
  };

  const updateUser = async (
    userId: string,
    userData: {
      full_name?: string;
      email?: string;
      crf?: string | null;
      unit_id?: string | null;
      role?: Role;
      password?: string;
      active?: boolean;
    }
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (currentUser && currentUser.id === userId && userData.active === false) {
        return { success: false, error: "Você não pode inativar o seu próprio usuário logado." };
      }

      if (userData.password && userData.password.trim().length >= 6) {
        if (isSupabaseConfigured && supabase) {
          const { error: pwErr } = await supabase.rpc("admin_update_user_password", {
            p_user_id: userId,
            p_new_password: userData.password.trim(),
          });
          if (pwErr) console.warn("Aviso ao atualizar senha no Supabase:", pwErr);
        }
      }

      const updatePayload: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (userData.full_name !== undefined) updatePayload.full_name = userData.full_name.trim();
      if (userData.email !== undefined) updatePayload.email = userData.email.trim().toLowerCase();
      if (userData.crf !== undefined) updatePayload.crf = userData.crf?.trim() || null;
      if (userData.unit_id !== undefined) updatePayload.unit_id = isValidUUID(userData.unit_id) ? userData.unit_id : null;
      if (userData.role !== undefined) updatePayload.role = userData.role;
      if (userData.active !== undefined) updatePayload.active = userData.active;

      if (isSupabaseConfigured && supabase && isValidUUID(userId)) {
        const { error } = await supabase
          .from("cb_profiles")
          .update(updatePayload)
          .eq("id", userId);

        if (error) {
          console.error("Erro ao atualizar perfil no Supabase:", error);
          return { success: false, error: error.message };
        }
      }

      setProfiles((prev) =>
        prev.map((p) => (p.id === userId ? { ...p, ...updatePayload } : p))
      );

      if (currentUser && currentUser.id === userId) {
        setCurrentUser((prev) => (prev ? { ...prev, ...updatePayload } : null));
      }

      await refreshFromSupabase();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Erro ao atualizar usuário." };
    }
  };

  const toggleUserActive = async (
    userId: string,
    newActive: boolean
  ): Promise<{ success: boolean; error?: string }> => {
    if (currentUser && currentUser.id === userId && !newActive) {
      return { success: false, error: "Você não pode inativar o seu próprio usuário logado." };
    }
    return updateUser(userId, { active: newActive });
  };

  // Importação em Lote de CIDs e Medicamentos SIGTAP (Admin)
  const importSIGTAPData = (
    newCids: Omit<CID, "id">[],
    newMeds: Omit<Medication, "id">[]
  ) => {
    if (!canManageCatalogs) {
      throw new Error("Apenas administradores podem importar dados da SIGTAP.");
    }

    let cidsAdded = 0;
    let medsAdded = 0;

    setCids((prev) => {
      const existingMap = new Map(prev.map((c) => [c.code.toUpperCase(), c]));
      const toAdd: CID[] = [];
      newCids.forEach((nc) => {
        const codeUpper = nc.code.toUpperCase();
        if (!existingMap.has(codeUpper)) {
          const newC: CID = {
            ...nc,
            code: codeUpper,
            id: generateUUID(),
            created_at: new Date().toISOString(),
          };
          existingMap.set(codeUpper, newC);
          toAdd.push(newC);
          cidsAdded++;
        }
      });
      return [...toAdd, ...prev];
    });

    setMedications((prev) => {
      const existingNames = new Map(prev.map((m) => [m.name.toLowerCase(), m]));
      const existingCodes = new Map(
        prev.filter((m) => !!m.sigtap_code).map((m) => [m.sigtap_code!, m])
      );
      const toAdd: Medication[] = [];

      newMeds.forEach((nm) => {
        const nameLower = nm.name.toLowerCase();
        const code = nm.sigtap_code || "";

        const existing = (code && existingCodes.get(code)) || existingNames.get(nameLower);

        if (existing) {
          if (nm.compatible_cid_codes && nm.compatible_cid_codes.length > 0) {
            const merged = Array.from(
              new Set([...(existing.compatible_cid_codes || []), ...nm.compatible_cid_codes])
            );
            existing.compatible_cid_codes = merged;
          }
          if (code && !existing.sigtap_code) {
            existing.sigtap_code = code;
          }
        } else {
          const newMed: Medication = {
            ...nm,
            component: "CEAF",
            id: generateUUID(),
            created_at: new Date().toISOString(),
          };
          existingNames.set(nameLower, newMed);
          if (code) existingCodes.set(code, newMed);
          toAdd.push(newMed);
          medsAdded++;
        }
      });

      return [...toAdd, ...prev];
    });

    return { cidsAdded, medsAdded };
  };

  // Limpar dados simulados para iniciar base real
  const clearSimulatedData = () => {
    setConsultations([]);
    setPatients([]);
    setMonthlyData([]);
  };

  // Restaurar dados de demonstração
  const restoreDemoData = () => {
    setConsultations(INITIAL_CONSULTATIONS);
    setPatients(INITIAL_PATIENTS);
    setMonthlyData(INITIAL_MONTHLY_DATA);
  };

  // Cadastrar Novo Usuário (Exclusivo da Área Administrativa)
  const registerUser = async (userData: {
    full_name: string;
    email: string;
    password: string;
    crf?: string;
    unit_id?: string | null;
    role: Role;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.rpc("admin_create_user", {
          p_email: userData.email.trim(),
          p_password: userData.password,
          p_full_name: userData.full_name.trim(),
          p_role: userData.role,
          p_crf: userData.crf?.trim() || null,
          p_unit_id: isValidUUID(userData.unit_id) ? userData.unit_id : null,
        });

        if (error) {
          console.error("Erro ao cadastrar usuário via RPC:", error);
          return { success: false, error: error.message };
        }

        if (data && data.success === false) {
          return { success: false, error: data.error || "Falha ao registrar usuário." };
        }

        // Atualiza a lista de perfis do Supabase
        await refreshFromSupabase();
        return { success: true };
      } else {
        // Fallback local caso Supabase não esteja disponível
        const newProfile: Profile = {
          id: generateUUID(),
          full_name: userData.full_name.trim(),
          email: userData.email.trim(),
          role: userData.role,
          crf: userData.crf?.trim() || null,
          unit_id: userData.unit_id || null,
          created_at: new Date().toISOString(),
        };
        setProfiles((prev) => [...prev, newProfile]);
        return { success: true };
      }
    } catch (err: any) {
      return { success: false, error: err?.message || "Erro inesperado ao registrar usuário." };
    }
  };

  // --- MÉTODOS CIMBAHIA ---

  // 1. Origens
  const addOrigem = async (origem: Omit<Origem, "id">): Promise<Origem> => {
    const newOrigem: Origem = {
      ...origem,
      id: generateUUID(),
      created_at: new Date().toISOString(),
    };
    setOrigens((prev) => [newOrigem, ...prev]);

    if (!isDemoMode && isSupabaseConfigured && supabase) {
      supabase
        .from("cb_origens")
        .insert({
          id: newOrigem.id,
          name: newOrigem.name,
          sigla: newOrigem.sigla || null,
          description: newOrigem.description || null,
          active: newOrigem.active ?? true,
        })
        .then(({ error }) => {
          if (error) console.warn("Supabase cb_origens insert warning:", error.message);
        });
    }

    return newOrigem;
  };

  const updateOrigem = async (id: string, data: Partial<Origem>): Promise<void> => {
    setOrigens((prev) => prev.map((o) => (o.id === id ? { ...o, ...data } : o)));

    if (!isDemoMode && isSupabaseConfigured && supabase && isValidUUID(id)) {
      supabase
        .from("cb_origens")
        .update(data)
        .eq("id", id)
        .then(({ error }) => {
          if (error) console.warn("Supabase cb_origens update warning:", error.message);
        });
    }
  };

  const deleteOrigem = async (id: string): Promise<void> => {
    setOrigens((prev) => prev.filter((o) => o.id !== id));

    if (!isDemoMode && isSupabaseConfigured && supabase && isValidUUID(id)) {
      supabase
        .from("cb_origens")
        .delete()
        .eq("id", id)
        .then(({ error }) => {
          if (error) console.warn("Supabase cb_origens delete warning:", error.message);
        });
    }
  };

  // 2. DIRES
  const addDires = async (dires: Omit<Dires, "id">): Promise<Dires> => {
    const newDires: Dires = {
      ...dires,
      id: generateUUID(),
      created_at: new Date().toISOString(),
    };
    setDiresList((prev) => [newDires, ...prev]);
    return newDires;
  };

  const updateDires = async (id: string, data: Partial<Dires>): Promise<void> => {
    setDiresList((prev) => prev.map((d) => (d.id === id ? { ...d, ...data } : d)));
  };

  const deleteDires = async (id: string): Promise<void> => {
    setDiresList((prev) => prev.filter((d) => d.id !== id));
  };

  // 3. Núcleos
  const addNucleo = async (nucleo: Omit<Nucleo, "id">): Promise<Nucleo> => {
    const newNucleo: Nucleo = {
      ...nucleo,
      id: generateUUID(),
      created_at: new Date().toISOString(),
    };
    setNucleos((prev) => [newNucleo, ...prev]);
    return newNucleo;
  };

  const updateNucleo = async (id: string, data: Partial<Nucleo>): Promise<void> => {
    setNucleos((prev) => prev.map((n) => (n.id === id ? { ...n, ...data } : n)));
  };

  const deleteNucleo = async (id: string): Promise<void> => {
    setNucleos((prev) => prev.filter((n) => n.id !== id));
  };

  // 4. Municípios
  const addMunicipio = async (mun: Omit<Municipio, "id">): Promise<Municipio> => {
    const newMun: Municipio = {
      ...mun,
      id: generateUUID(),
      created_at: new Date().toISOString(),
    };
    setMunicipios((prev) => [newMun, ...prev]);

    if (!isDemoMode && isSupabaseConfigured && supabase) {
      supabase
        .from("cb_municipios")
        .insert({
          id: newMun.id,
          ibge_code: newMun.ibge_code,
          name: newMun.name,
          base_id: isValidUUID(newMun.base_id) ? newMun.base_id : null,
          dires_id: isValidUUID(newMun.dires_id) ? newMun.dires_id : null,
          nucleo_id: isValidUUID(newMun.nucleo_id) ? newMun.nucleo_id : null,
          population: newMun.population || null,
          active: newMun.active ?? true,
        })
        .then(({ error }) => {
          if (error) console.warn("Supabase cb_municipios insert warning:", error.message);
        });
    }

    return newMun;
  };

  const updateMunicipio = async (id: string, data: Partial<Municipio>): Promise<void> => {
    setMunicipios((prev) => prev.map((m) => (m.id === id ? { ...m, ...data } : m)));

    if (!isDemoMode && isSupabaseConfigured && supabase && isValidUUID(id)) {
      supabase
        .from("cb_municipios")
        .update(data)
        .eq("id", id)
        .then(({ error }) => {
          if (error) console.warn("Supabase cb_municipios update warning:", error.message);
        });
    }
  };

  const deleteMunicipio = async (id: string): Promise<void> => {
    setMunicipios((prev) => prev.filter((m) => m.id !== id));

    if (!isDemoMode && isSupabaseConfigured && supabase && isValidUUID(id)) {
      supabase
        .from("cb_municipios")
        .delete()
        .eq("id", id)
        .then(({ error }) => {
          if (error) console.warn("Supabase cb_municipios delete warning:", error.message);
        });
    }
  };

  // 5. Outros Medicamentos
  const addOtherMedication = async (med: Omit<OtherMedication, "id" | "created_at">): Promise<OtherMedication> => {
    const newMed: OtherMedication = {
      ...med,
      id: generateUUID(),
      created_at: new Date().toISOString(),
    };
    setOtherMedications((prev) => [newMed, ...prev]);

    if (!isDemoMode && isSupabaseConfigured && supabase) {
      supabase
        .from("cb_other_medications")
        .insert({
          id: newMed.id,
          name: newMed.name,
          active_ingredient: newMed.active_ingredient,
          dosage: newMed.dosage || null,
          pharmaceutical_form: newMed.pharmaceutical_form || null,
          anvisa_registry: newMed.anvisa_registry || null,
          category: newMed.category || "Não Padronizado no SUS",
          notes: newMed.notes || null,
          estimated_unit_cost: newMed.estimated_unit_cost || null,
          active: newMed.active ?? true,
        })
        .then(({ error }) => {
          if (error) console.warn("Supabase cb_other_medications insert warning:", error.message);
        });
    }

    return newMed;
  };

  const updateOtherMedication = async (id: string, data: Partial<OtherMedication>): Promise<void> => {
    setOtherMedications((prev) => prev.map((m) => (m.id === id ? { ...m, ...data, updated_at: new Date().toISOString() } : m)));

    if (!isDemoMode && isSupabaseConfigured && supabase && isValidUUID(id)) {
      supabase
        .from("cb_other_medications")
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .then(({ error }) => {
          if (error) console.warn("Supabase cb_other_medications update warning:", error.message);
        });
    }
  };

  const toggleOtherMedicationActive = async (id: string, active: boolean): Promise<void> => {
    setOtherMedications((prev) => prev.map((m) => (m.id === id ? { ...m, active } : m)));

    if (!isDemoMode && isSupabaseConfigured && supabase && isValidUUID(id)) {
      supabase
        .from("cb_other_medications")
        .update({ active, updated_at: new Date().toISOString() })
        .eq("id", id)
        .then(({ error }) => {
          if (error) console.warn("Supabase cb_other_medications toggle warning:", error.message);
        });
    }
  };

  // 5.1 Fármacos & Apresentações Unificados (Anvisa / SUS)
  const addFarmaco = async (farmaco: Omit<Farmaco, "id">): Promise<Farmaco> => {
    const newF: Farmaco = {
      ...farmaco,
      id: generateUUID(),
      created_at: new Date().toISOString(),
    };
    setFarmacos((prev) => [newF, ...prev]);
    return newF;
  };

  const updateFarmaco = async (id: string, data: Partial<Farmaco>): Promise<void> => {
    setFarmacos((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...data, updated_at: new Date().toISOString() } : f))
    );
  };

  const toggleFarmacoActive = async (id: string, active: boolean): Promise<void> => {
    setFarmacos((prev) => prev.map((f) => (f.id === id ? { ...f, active } : f)));
  };

  const deleteFarmaco = async (id: string): Promise<void> => {
    setFarmacos((prev) => prev.filter((f) => f.id !== id));
  };

  // 6. Tipos de Parecer
  const addTipoParecer = async (tp: Omit<TipoParecer, "id">): Promise<TipoParecer> => {
    const newTp: TipoParecer = {
      ...tp,
      id: generateUUID(),
      created_at: new Date().toISOString(),
    };
    setTiposParecer((prev) => [newTp, ...prev]);

    if (!isDemoMode && isSupabaseConfigured && supabase) {
      supabase
        .from("cb_tipos_parecer")
        .insert({
          id: newTp.id,
          code: newTp.code,
          title: newTp.title,
          regulatory_effect: newTp.regulatory_effect,
          description: newTp.description || null,
          active: newTp.active ?? true,
        })
        .then(({ error }) => {
          if (error) console.warn("Supabase cb_tipos_parecer insert warning:", error.message);
        });
    }

    return newTp;
  };

  const updateTipoParecer = async (id: string, data: Partial<TipoParecer>): Promise<void> => {
    setTiposParecer((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));

    if (!isDemoMode && isSupabaseConfigured && supabase && isValidUUID(id)) {
      supabase
        .from("cb_tipos_parecer")
        .update(data)
        .eq("id", id)
        .then(({ error }) => {
          if (error) console.warn("Supabase cb_tipos_parecer update warning:", error.message);
        });
    }
  };

  const toggleTipoParecerActive = async (id: string, active: boolean): Promise<void> => {
    setTiposParecer((prev) => prev.map((t) => (t.id === id ? { ...t, active } : t)));

    if (!isDemoMode && isSupabaseConfigured && supabase && isValidUUID(id)) {
      supabase
        .from("cb_tipos_parecer")
        .update({ active })
        .eq("id", id)
        .then(({ error }) => {
          if (error) console.warn("Supabase cb_tipos_parecer toggle warning:", error.message);
        });
    }
  };

  // 7. Importador em lote de CIDs da Planilha
  const importCIDsBatch = async (
    rawCids: Array<{ code: string; description: string; chapter?: string; group_name?: string }>
  ): Promise<{ addedCount: number; updatedCount: number }> => {
    let addedCount = 0;
    let updatedCount = 0;

    setCids((prev) => {
      const map = new Map(prev.map((c) => [c.code.toUpperCase().trim(), c]));
      const toAdd: CID[] = [];

      rawCids.forEach((item) => {
        const cleanCode = item.code.toUpperCase().trim();
        if (!cleanCode) return;

        if (map.has(cleanCode)) {
          const existing = map.get(cleanCode)!;
          existing.description = item.description || existing.description;
          if (item.chapter) existing.chapter = item.chapter;
          if (item.group_name) existing.group_name = item.group_name;
          updatedCount++;
        } else {
          const newC: CID = {
            id: generateUUID(),
            code: cleanCode,
            description: item.description,
            chapter: item.chapter || null,
            group_name: item.group_name || null,
            active: true,
            created_at: new Date().toISOString(),
          };
          map.set(cleanCode, newC);
          toAdd.push(newC);
          addedCount++;
        }
      });

      return [...toAdd, ...prev];
    });

    if (!isDemoMode && isSupabaseConfigured && supabase) {
      const cidsToPersist = rawCids
        .filter((r) => r.code && r.code.trim())
        .map((r) => ({
          code: r.code.toUpperCase().trim(),
          description: r.description,
          chapter: r.chapter || null,
          group_name: r.group_name || null,
          active: true,
        }));
      if (cidsToPersist.length > 0) {
        supabase
          .from("cb_cids")
          .upsert(cidsToPersist, { onConflict: "code" })
          .then(({ error }) => {
            if (error) console.warn("Supabase cb_cids upsert warning:", error.message);
          });
      }
    }

    return { addedCount, updatedCount };
  };

  // 8. Atualização Integral de Unidade
  const updateUnitFull = async (id: string, data: Partial<Unit>): Promise<void> => {
    setUnits((prev) =>
      prev.map((u) =>
        u.id === id
          ? {
              ...u,
              ...data,
              updated_at: new Date().toISOString(),
            }
          : u
      )
    );

    if (isSupabaseConfigured && supabase && isValidUUID(id)) {
      supabase
        .from("cb_units")
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .then(({ error }) => {
          if (error) console.warn("Supabase cb_units update warning:", error.message);
        });
    }
  };

  // 9. Processos SEI & Workflow
  const addProcesso = async (proc: Omit<Processo, "id" | "created_at">): Promise<Processo> => {
    const newProcessoId = generateUUID();
    const histId = generateUUID();
    const newProcesso: Processo = {
      ...proc,
      id: newProcessoId,
      created_at: new Date().toISOString(),
      historico: [
        {
          id: histId,
          processo_id: newProcessoId,
          from_status: null,
          to_status: proc.status,
          user_id: currentUser?.id || "sistema",
          user_name: currentUser?.full_name || "Sistema",
          notes: "Processo autuado no CimBahia com base no SEI.",
          timestamp: new Date().toISOString(),
        },
      ],
    };

    setProcessos((prev) => [newProcesso, ...prev]);

    const client = supabase;
    if (!isDemoMode && isSupabaseConfigured && client) {
      client
        .from("cb_processos")
        .insert({
          id: newProcesso.id,
          numero_sei: newProcesso.numero_sei,
          data_abertura: newProcesso.data_abertura || new Date().toISOString().split("T")[0],
          assunto: newProcesso.assunto,
          paciente_id: newProcesso.paciente_id,
          origem_id: isValidUUID(newProcesso.origem_id) ? newProcesso.origem_id : null,
          origem_nome: newProcesso.origem?.name || null,
          municipio_id: isValidUUID(newProcesso.municipio_id) ? newProcesso.municipio_id : null,
          municipio_nome: newProcesso.municipio?.name || null,
          unidade_id: isValidUUID(newProcesso.unidade_id) ? newProcesso.unidade_id : null,
          status: newProcesso.status || "triagem",
          priority: newProcesso.priority || "normal",
          triagem_by_id: isValidUUID(newProcesso.triagem_by_id) ? newProcesso.triagem_by_id : null,
          triagem_by_name: newProcesso.triagem_by_name || null,
          triagem_completed_at: newProcesso.triagem_completed_at || null,
          triagem_notes: newProcesso.triagem_notes || null,
          triagem_documents_ok: newProcesso.triagem_documents_ok ?? false,
          assigned_pharmacist_id: isValidUUID(newProcesso.assigned_pharmacist_id) ? newProcesso.assigned_pharmacist_id : null,
          assigned_at: newProcesso.assigned_at || null,
          sla_limit_date: newProcesso.sla_limit_date || new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0],
          days_in_current_status: newProcesso.days_in_current_status || 1,
          is_sla_delayed: newProcesso.is_sla_delayed ?? false,
          observations: newProcesso.observations || null,
        })
        .then(async ({ error }) => {
          if (error) console.warn("Supabase cb_processos insert warning:", error.message);

          if (newProcesso.items && newProcesso.items.length > 0) {
            const itemRows = newProcesso.items.map((it) => ({
              id: isValidUUID(it.id) ? it.id : generateUUID(),
              processo_id: newProcesso.id,
              medication_type: it.medication_type || "ceaf",
              medication_id: it.medication_id || null,
              medication_name: it.medication_name,
              farmaco_substancia: it.farmaco_substancia || null,
              cid_id: isValidUUID(it.cid_id) ? it.cid_id : null,
              cid_code: it.cid_code,
              cid_description: it.cid_description || null,
              cid_nao_informado: it.cid_nao_informado ?? false,
              posology: it.posology || null,
              monthly_quantity: it.monthly_quantity ?? 1,
              status: it.status || "pendente",
              justification: it.justification || null,
              evaluated_at: it.evaluated_at || null,
              evaluated_by: it.evaluated_by || null,
            }));
            await client.from("cb_processo_items").insert(itemRows);
          }

          if (newProcesso.historico && newProcesso.historico.length > 0) {
            const h = newProcesso.historico[0];
            await client.from("cb_processo_historico").insert({
              id: h.id,
              processo_id: newProcesso.id,
              from_status: h.from_status || null,
              to_status: h.to_status,
              user_id: h.user_id,
              user_name: h.user_name,
              notes: h.notes || null,
              timestamp: h.timestamp,
            });
          }
        });
    }

    return newProcesso;
  };

  const updateProcesso = async (id: string, data: Partial<Processo>): Promise<void> => {
    setProcessos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...data, updated_at: new Date().toISOString() } : p))
    );

    if (!isDemoMode && isSupabaseConfigured && supabase && isValidUUID(id)) {
      const procPayload: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (data.status !== undefined) procPayload.status = data.status;
      if (data.priority !== undefined) procPayload.priority = data.priority;
      if (data.assunto !== undefined) procPayload.assunto = data.assunto;
      if (data.triagem_by_id !== undefined) procPayload.triagem_by_id = isValidUUID(data.triagem_by_id) ? data.triagem_by_id : null;
      if (data.triagem_by_name !== undefined) procPayload.triagem_by_name = data.triagem_by_name;
      if (data.triagem_completed_at !== undefined) procPayload.triagem_completed_at = data.triagem_completed_at;
      if (data.triagem_notes !== undefined) procPayload.triagem_notes = data.triagem_notes;
      if (data.triagem_documents_ok !== undefined) procPayload.triagem_documents_ok = data.triagem_documents_ok;
      if (data.assigned_pharmacist_id !== undefined) procPayload.assigned_pharmacist_id = isValidUUID(data.assigned_pharmacist_id) ? data.assigned_pharmacist_id : null;
      if (data.assigned_at !== undefined) procPayload.assigned_at = data.assigned_at;
      if (data.sla_limit_date !== undefined) procPayload.sla_limit_date = data.sla_limit_date;
      if (data.days_in_current_status !== undefined) procPayload.days_in_current_status = data.days_in_current_status;
      if (data.is_sla_delayed !== undefined) procPayload.is_sla_delayed = data.is_sla_delayed;
      if (data.observations !== undefined) procPayload.observations = data.observations;

      supabase
        .from("cb_processos")
        .update(procPayload)
        .eq("id", id)
        .then(({ error }) => {
          if (error) console.warn("Supabase cb_processos update warning:", error.message);
        });

      if (data.items) {
        const itemRows = data.items.map((it) => ({
          id: isValidUUID(it.id) ? it.id : generateUUID(),
          processo_id: id,
          medication_type: it.medication_type || "ceaf",
          medication_id: it.medication_id || null,
          medication_name: it.medication_name,
          farmaco_substancia: it.farmaco_substancia || null,
          cid_id: isValidUUID(it.cid_id) ? it.cid_id : null,
          cid_code: it.cid_code,
          cid_description: it.cid_description || null,
          cid_nao_informado: it.cid_nao_informado ?? false,
          posology: it.posology || null,
          monthly_quantity: it.monthly_quantity ?? 1,
          status: it.status || "pendente",
          justification: it.justification || null,
          evaluated_at: it.evaluated_at || null,
          evaluated_by: it.evaluated_by || null,
        }));
        supabase
          .from("cb_processo_items")
          .upsert(itemRows)
          .then(({ error }) => {
            if (error) console.warn("Supabase cb_processo_items upsert warning:", error.message);
          });
      }
    }
  };

  const deleteProcesso = async (id: string): Promise<{ success: boolean; error?: string }> => {
    const target = processos.find((p) => p.id === id);
    if (!target) {
      return { success: false, error: "Processo SEI não encontrado." };
    }

    if (!isProcessoInFirstStatus(target)) {
      return {
        success: false,
        error:
          "Exclusão não permitida: O processo SEI só pode ser excluído no primeiro status (Triagem / Inicial). Processos em análise técnica ou concluídos possuem fé pública e registro regulatório permanente.",
      };
    }

    setProcessos((prev) => prev.filter((p) => p.id !== id));

    if (!isDemoMode && isSupabaseConfigured && supabase && isValidUUID(id)) {
      supabase
        .from("cb_processos")
        .delete()
        .eq("id", id)
        .then(({ error }) => {
          if (error) console.warn("Supabase cb_processos delete warning:", error.message);
        });
    }

    return { success: true };
  };

  const transicionarProcessoStatus = async (
    processoId: string,
    newStatus: ProcessoStatus,
    notes?: string
  ): Promise<void> => {
    const histItem = {
      id: generateUUID(),
      processo_id: processoId,
      from_status: (processos.find((p) => p.id === processoId)?.status || null) as ProcessoStatus | null,
      to_status: newStatus,
      user_id: currentUser?.id || "sistema",
      user_name: currentUser?.full_name || "Sistema",
      notes: notes || null,
      timestamp: new Date().toISOString(),
    };

    setProcessos((prev) =>
      prev.map((p) => {
        if (p.id !== processoId) return p;
        return {
          ...p,
          status: newStatus,
          days_in_current_status: 0,
          historico: [histItem, ...(p.historico || [])],
          updated_at: new Date().toISOString(),
        };
      })
    );

    if (!isDemoMode && isSupabaseConfigured && supabase && isValidUUID(processoId)) {
      supabase
        .from("cb_processos")
        .update({
          status: newStatus,
          days_in_current_status: 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", processoId)
        .then(({ error }) => {
          if (error) console.warn("Supabase cb_processos status update warning:", error.message);
        });

      supabase
        .from("cb_processo_historico")
        .insert({
          id: histItem.id,
          processo_id: histItem.processo_id,
          from_status: histItem.from_status,
          to_status: histItem.to_status,
          user_id: histItem.user_id,
          user_name: histItem.user_name,
          notes: histItem.notes,
          timestamp: histItem.timestamp,
        })
        .then(({ error }) => {
          if (error) console.warn("Supabase cb_processo_historico insert warning:", error.message);
        });
    }
  };

  const atribuirFarmaceuticoProcesso = async (
    processoId: string,
    pharmacistId: string
  ): Promise<void> => {
    const targetPharmacist = profiles.find((p) => p.id === pharmacistId);
    const histItem = {
      id: generateUUID(),
      processo_id: processoId,
      from_status: (processos.find((p) => p.id === processoId)?.status || null) as ProcessoStatus | null,
      to_status: "em_analise_farmaceutica" as ProcessoStatus,
      user_id: currentUser?.id || "sistema",
      user_name: currentUser?.full_name || "Sistema",
      notes: `Processo atribuído à parecerista: ${targetPharmacist?.full_name || "Farmacêutico"}`,
      timestamp: new Date().toISOString(),
    };

    setProcessos((prev) =>
      prev.map((p) => {
        if (p.id !== processoId) return p;
        return {
          ...p,
          assigned_pharmacist_id: pharmacistId,
          assigned_pharmacist: targetPharmacist || null,
          assigned_at: new Date().toISOString(),
          status: "em_analise_farmaceutica" as ProcessoStatus,
          historico: [histItem, ...(p.historico || [])],
          updated_at: new Date().toISOString(),
        };
      })
    );

    if (!isDemoMode && isSupabaseConfigured && supabase && isValidUUID(processoId)) {
      supabase
        .from("cb_processos")
        .update({
          assigned_pharmacist_id: isValidUUID(pharmacistId) ? pharmacistId : null,
          assigned_at: new Date().toISOString(),
          status: "em_analise_farmaceutica",
          updated_at: new Date().toISOString(),
        })
        .eq("id", processoId)
        .then(({ error }) => {
          if (error) console.warn("Supabase cb_processos attribution warning:", error.message);
        });

      supabase
        .from("cb_processo_historico")
        .insert({
          id: histItem.id,
          processo_id: histItem.processo_id,
          from_status: histItem.from_status,
          to_status: histItem.to_status,
          user_id: histItem.user_id,
          user_name: histItem.user_name,
          notes: histItem.notes,
          timestamp: histItem.timestamp,
        })
        .then(({ error }) => {
          if (error) console.warn("Supabase cb_processo_historico insert warning:", error.message);
        });
    }
  };

  const emitirParecerProcesso = async (
    processoId: string,
    parecerData: {
      tipo_parecer_id: string;
      tipo_parecer_title: string;
      regulatory_effect: TipoParecer["regulatory_effect"];
      technical_justification: string;
      clinical_foundation: string;
      recommendations?: string | null;
    }
  ): Promise<void> => {
    const activeVer: ParecerVersao = {
      id: generateUUID(),
      parecer_id: generateUUID(),
      version_number: 1,
      pharmacist_id: currentUser?.id || "anon",
      pharmacist_name: currentUser?.full_name || "Farmacêutico Parecerista",
      crf: currentUser?.crf || "CRF-BA",
      tipo_parecer_id: parecerData.tipo_parecer_id,
      tipo_parecer_title: parecerData.tipo_parecer_title,
      regulatory_effect: parecerData.regulatory_effect,
      technical_justification: parecerData.technical_justification,
      clinical_foundation: parecerData.clinical_foundation,
      recommendations: parecerData.recommendations || null,
      signature_hash: `SHA256:${generateUUID().replace(/-/g, "")}`,
      created_at: new Date().toISOString(),
    };

    const finalStatus: ProcessoStatus =
      parecerData.regulatory_effect === "deferido"
        ? "concluido_deferido"
        : parecerData.regulatory_effect === "indeferido"
        ? "concluido_indeferido"
        : parecerData.regulatory_effect === "exigencia"
        ? "em_exigencia"
        : "concluido_parcial";

    const histItem = {
      id: generateUUID(),
      processo_id: processoId,
      from_status: (processos.find((p) => p.id === processoId)?.status || null) as ProcessoStatus | null,
      to_status: finalStatus,
      user_id: currentUser?.id || "sistema",
      user_name: currentUser?.full_name || "Farmacêutico",
      notes: `Parecer técnico emitido: ${parecerData.tipo_parecer_title}`,
      timestamp: new Date().toISOString(),
    };

    setProcessos((prev) =>
      prev.map((p) => {
        if (p.id !== processoId) return p;
        return {
          ...p,
          status: finalStatus,
          parecer: {
            id: activeVer.parecer_id,
            processo_id: p.id,
            active_version: activeVer,
            versions_history: [],
          },
          historico: [histItem, ...(p.historico || [])],
          updated_at: new Date().toISOString(),
        };
      })
    );

    if (!isDemoMode && isSupabaseConfigured && supabase && isValidUUID(processoId)) {
      await supabase.from("cb_pareceres").upsert({
        id: activeVer.parecer_id,
        processo_id: processoId,
      });

      await supabase.from("cb_parecer_versoes").insert({
        id: activeVer.id,
        parecer_id: activeVer.parecer_id,
        version_number: 1,
        pharmacist_id: isValidUUID(activeVer.pharmacist_id) ? activeVer.pharmacist_id : null,
        pharmacist_name: activeVer.pharmacist_name,
        crf: activeVer.crf,
        tipo_parecer_id: isValidUUID(activeVer.tipo_parecer_id) ? activeVer.tipo_parecer_id : null,
        tipo_parecer_title: activeVer.tipo_parecer_title,
        regulatory_effect: activeVer.regulatory_effect,
        technical_justification: activeVer.technical_justification,
        clinical_foundation: activeVer.clinical_foundation,
        recommendations: activeVer.recommendations || null,
        signature_hash: activeVer.signature_hash,
      });

      await supabase
        .from("cb_processos")
        .update({
          status: finalStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", processoId);

      await supabase.from("cb_processo_historico").insert({
        id: histItem.id,
        processo_id: histItem.processo_id,
        from_status: histItem.from_status,
        to_status: histItem.to_status,
        user_id: histItem.user_id,
        user_name: histItem.user_name,
        notes: histItem.notes,
        timestamp: histItem.timestamp,
      });
    }
  };

  const retificarParecerProcesso = async (
    processoId: string,
    parecerData: {
      tipo_parecer_id: string;
      tipo_parecer_title: string;
      regulatory_effect: TipoParecer["regulatory_effect"];
      technical_justification: string;
      clinical_foundation: string;
      recommendations?: string | null;
    },
    rectificationReason: string
  ): Promise<void> => {
    const targetProcesso = processos.find((p) => p.id === processoId);
    if (!targetProcesso || !targetProcesso.parecer) return;

    const currentActive = targetProcesso.parecer.active_version;
    const newVerNum = currentActive.version_number + 1;

    const newActiveVer: ParecerVersao = {
      id: generateUUID(),
      parecer_id: targetProcesso.parecer.id,
      version_number: newVerNum,
      pharmacist_id: currentUser?.id || "anon",
      pharmacist_name: currentUser?.full_name || "Farmacêutico Parecerista",
      crf: currentUser?.crf || "CRF-BA",
      tipo_parecer_id: parecerData.tipo_parecer_id,
      tipo_parecer_title: parecerData.tipo_parecer_title,
      regulatory_effect: parecerData.regulatory_effect,
      technical_justification: parecerData.technical_justification,
      clinical_foundation: parecerData.clinical_foundation,
      recommendations: parecerData.recommendations || null,
      rectification_reason: rectificationReason,
      signature_hash: `SHA256:${generateUUID().replace(/-/g, "")}`,
      created_at: new Date().toISOString(),
    };

    const finalStatus: ProcessoStatus =
      parecerData.regulatory_effect === "deferido"
        ? "concluido_deferido"
        : parecerData.regulatory_effect === "indeferido"
        ? "concluido_indeferido"
        : parecerData.regulatory_effect === "exigencia"
        ? "em_exigencia"
        : "concluido_parcial";

    const histItem = {
      id: generateUUID(),
      processo_id: processoId,
      from_status: targetProcesso.status,
      to_status: finalStatus,
      user_id: currentUser?.id || "sistema",
      user_name: currentUser?.full_name || "Farmacêutico",
      notes: `Parecer retificado (Versão ${newVerNum}). Motivo: ${rectificationReason}`,
      timestamp: new Date().toISOString(),
    };

    setProcessos((prev) =>
      prev.map((p) => {
        if (p.id !== processoId || !p.parecer) return p;
        return {
          ...p,
          status: finalStatus,
          parecer: {
            ...p.parecer,
            active_version: newActiveVer,
            versions_history: [currentActive, ...(p.parecer.versions_history || [])],
          },
          historico: [histItem, ...(p.historico || [])],
          updated_at: new Date().toISOString(),
        };
      })
    );

    if (!isDemoMode && isSupabaseConfigured && supabase && isValidUUID(processoId)) {
      await supabase.from("cb_parecer_versoes").insert({
        id: newActiveVer.id,
        parecer_id: newActiveVer.parecer_id,
        version_number: newVerNum,
        pharmacist_id: isValidUUID(newActiveVer.pharmacist_id) ? newActiveVer.pharmacist_id : null,
        pharmacist_name: newActiveVer.pharmacist_name,
        crf: newActiveVer.crf,
        tipo_parecer_id: isValidUUID(newActiveVer.tipo_parecer_id) ? newActiveVer.tipo_parecer_id : null,
        tipo_parecer_title: newActiveVer.tipo_parecer_title,
        regulatory_effect: newActiveVer.regulatory_effect,
        technical_justification: newActiveVer.technical_justification,
        clinical_foundation: newActiveVer.clinical_foundation,
        recommendations: newActiveVer.recommendations || null,
        rectification_reason: rectificationReason,
        signature_hash: newActiveVer.signature_hash,
      });

      await supabase
        .from("cb_processos")
        .update({
          status: finalStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", processoId);

      await supabase.from("cb_processo_historico").insert({
        id: histItem.id,
        processo_id: histItem.processo_id,
        from_status: histItem.from_status,
        to_status: histItem.to_status,
        user_id: histItem.user_id,
        user_name: histItem.user_name,
        notes: histItem.notes,
        timestamp: histItem.timestamp,
      });
    }
  };

  return (
    <AppContext.Provider
      value={{
        units,
        profiles,
        cids,
        medications,
        patients,
        consultations,
        monthlyData,
        currentUser,
        selectedUnitId,
        activeUnit,
        selectedUnit,
        canEdit,
        canManageCatalogs,
        isViewingOtherUnit,
        isSupabaseOnline,
        isSyncing,
        refreshFromSupabase,
        isDemoMode,
        isAuthenticated,
        authChecked,
        loginWithCredentials,
        enterDemoMode,
        logout,
        setCurrentUser,
        setSelectedUnitId,
        addPatient,
        updatePatient,
        addConsultation,
        updateConsultation,
        updateMonthlyData,
        addCID,
        updateCID,
        toggleCIDActive,
        addMedication,
        updateMedication,
        toggleMedicationActive,
        addUnit,
        updateUnit,
        updateUser,
        toggleUserActive,
        importSIGTAPData,
        clearSimulatedData,
        restoreDemoData,
        registerUser,

        // CimBahia
        origens,
        diresList,
        nucleos,
        bases,
        municipios,
        otherMedications,
        tiposParecer,
        processos,
        addOrigem,
        updateOrigem,
        deleteOrigem,
        addDires,
        updateDires,
        deleteDires,
        addNucleo,
        updateNucleo,
        deleteNucleo,
        addMunicipio,
        updateMunicipio,
        deleteMunicipio,
        farmacos,
        addFarmaco,
        updateFarmaco,
        toggleFarmacoActive,
        deleteFarmaco,
        addOtherMedication,
        updateOtherMedication,
        toggleOtherMedicationActive,
        addTipoParecer,
        updateTipoParecer,
        toggleTipoParecerActive,
        importCIDsBatch,
        updateUnitFull,
        addProcesso,
        updateProcesso,
        deleteProcesso,
        transicionarProcessoStatus,
        atribuirFarmaceuticoProcesso,
        emitirParecerProcesso,
        retificarParecerProcesso,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
