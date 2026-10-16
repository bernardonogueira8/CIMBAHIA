"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  Unit,
  Profile,
  CID,
  Medication,
  Patient,
  Consultation,
  MonthlyComplementaryData,
} from "../types";
import {
  INITIAL_UNITS,
  INITIAL_PROFILES,
  INITIAL_CIDS,
  INITIAL_MEDICATIONS,
  INITIAL_PATIENTS,
  INITIAL_CONSULTATIONS,
  INITIAL_MONTHLY_DATA,
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
  currentUser: Profile;
  selectedUnitId: string; // "all" or specific unit id
  activeUnit: Unit | null;
  selectedUnit: Unit | null;
  canEdit: boolean;
  canManageCatalogs: boolean;
  isViewingOtherUnit: boolean;
  isSupabaseOnline: boolean;
  isSyncing: boolean;
  refreshFromSupabase: () => Promise<void>;
  setCurrentUser: (user: Profile) => void;
  setSelectedUnitId: (unitId: string) => void;
  addPatient: (patient: Omit<Patient, "id" | "created_at">) => Patient;
  updatePatient: (id: string, patient: Partial<Patient>) => void;
  addConsultation: (consultation: Omit<Consultation, "id" | "created_at">) => Consultation;
  updateMonthlyData: (data: Omit<MonthlyComplementaryData, "id" | "updated_at">) => void;
  addCID: (cid: Omit<CID, "id">) => CID;
  addMedication: (med: Omit<Medication, "id">) => Medication;
  addUnit: (unit: Omit<Unit, "id">) => Unit;
  importSIGTAPData: (
    newCids: Omit<CID, "id">[],
    newMeds: Omit<Medication, "id">[]
  ) => { cidsAdded: number; medsAdded: number };
  resetCatalogsToOfficialCEAF: () => void;
  clearSimulatedData: () => void;
  restoreDemoData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY_PREFIX = "pharmacare_";

function getStoredOrDefault<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const item = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.error("Failed to save to localStorage", e);
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [units, setUnits] = useState<Unit[]>(() =>
    getStoredOrDefault("units", INITIAL_UNITS)
  );
  const [profiles, setProfiles] = useState<Profile[]>(() =>
    getStoredOrDefault("profiles", INITIAL_PROFILES)
  );
  const [cids, setCids] = useState<CID[]>(() =>
    getStoredOrDefault("cids", INITIAL_CIDS)
  );
  const [medications, setMedications] = useState<Medication[]>(() =>
    getStoredOrDefault("medications", INITIAL_MEDICATIONS)
  );
  const [patients, setPatients] = useState<Patient[]>(() =>
    getStoredOrDefault("patients", INITIAL_PATIENTS)
  );
  const [consultations, setConsultations] = useState<Consultation[]>(() =>
    getStoredOrDefault("consultations", INITIAL_CONSULTATIONS)
  );
  const [monthlyData, setMonthlyData] = useState<MonthlyComplementaryData[]>(() =>
    getStoredOrDefault("monthlyData", INITIAL_MONTHLY_DATA)
  );

  const [isSupabaseOnline, setIsSupabaseOnline] = useState<boolean>(isSupabaseConfigured);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Usuário ativo no sistema (padrão Dra. Juliana Mendes de Paulo Afonso)
  const [currentUser, setCurrentUser] = useState<Profile>(() => {
    const stored = getStoredOrDefault<Profile | null>("currentUser", null);
    return stored || INITIAL_PROFILES[0];
  });

  // Unidade sendo visualizada (padrão a própria unidade do usuário)
  const [selectedUnitId, setSelectedUnitId] = useState<string>(
    currentUser.unit_id || "11111111-1111-1111-1111-111111111111"
  );

  // Sincronização e Carga de dados a partir do Supabase
  const refreshFromSupabase = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      setIsSyncing(true);

      // 1. Unidades e CIDs
      const [unitsRes, cidsRes, medsRes, relsRes, profilesRes, patsRes, consRes, monthlyRes] =
        await Promise.all([
          supabase.from("units").select("*").order("name"),
          supabase.from("cids").select("*").order("code"),
          supabase.from("medications").select("*").order("name"),
          supabase.from("medication_authorized_cids").select("sigtap_code, cid_code"),
          supabase.from("profiles").select("*"),
          supabase.from("patients").select("*").order("full_name"),
          supabase
            .from("consultations")
            .select(`
              *,
              consultation_medications (
                medication_id,
                medications (*)
              ),
              consultation_prfs (*)
            `)
            .order("consultation_date", { ascending: false }),
          supabase.from("monthly_complementary_data").select("*"),
        ]);

      if (unitsRes.data && unitsRes.data.length > 0) {
        setUnits(unitsRes.data);
      }
      if (cidsRes.data && cidsRes.data.length > 0) {
        setCids(cidsRes.data);
      }
      if (profilesRes.data && profilesRes.data.length > 0) {
        setProfiles(profilesRes.data);
      }

      // 2. Mapeamento de CIDs compatíveis nos medicamentos
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

      if (patsRes.data && patsRes.data.length > 0) {
        setPatients(patsRes.data);
      }

      if (consRes.data && consRes.data.length > 0) {
        const mappedCons: Consultation[] = consRes.data.map((c: any) => ({
          ...c,
          medications: (c.consultation_medications || [])
            .map((cm: any) => cm.medications)
            .filter(Boolean),
          prfs: c.consultation_prfs || [],
        }));
        setConsultations(mappedCons);
      }

      if (monthlyRes.data && monthlyRes.data.length > 0) {
        setMonthlyData(monthlyRes.data);
      }

      setIsSupabaseOnline(true);
    } catch (err) {
      console.warn("Supabase fetch error, maintaining local state cache:", err);
      setIsSupabaseOnline(false);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Carrega do Supabase na montagem inicial
  useEffect(() => {
    refreshFromSupabase();
  }, [refreshFromSupabase]);

  // Monitora autenticação Supabase Auth para sincronizar perfil logado
  useEffect(() => {
    const client = supabase;
    if (!isSupabaseConfigured || !client) return;

    const syncUser = async () => {
      const {
        data: { user },
      } = await client.auth.getUser();
      if (user && user.email) {
        const matched = profiles.find(
          (p) => p.email.toLowerCase() === user.email?.toLowerCase() || p.id === user.id
        );
        if (matched) {
          setCurrentUser(matched);
          if (matched.unit_id) {
            setSelectedUnitId(matched.unit_id);
          }
        }
      }
    };

    syncUser();

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user?.email) {
        const matched = profiles.find(
          (p) => p.email.toLowerCase() === session.user.email?.toLowerCase() || p.id === session.user.id
        );
        if (matched) {
          setCurrentUser(matched);
          if (matched.unit_id) {
            setSelectedUnitId(matched.unit_id);
          }
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [profiles]);

  // Efeitos para persistência em localStorage (fallback offline contínuo)
  useEffect(() => saveToStorage("units", units), [units]);
  useEffect(() => saveToStorage("profiles", profiles), [profiles]);
  useEffect(() => saveToStorage("cids", cids), [cids]);
  useEffect(() => saveToStorage("medications", medications), [medications]);
  useEffect(() => saveToStorage("patients", patients), [patients]);
  useEffect(() => saveToStorage("consultations", consultations), [consultations]);
  useEffect(() => saveToStorage("monthlyData", monthlyData), [monthlyData]);
  useEffect(() => saveToStorage("currentUser", currentUser), [currentUser]);

  // Unidade do usuário logado
  const activeUnit = units.find((u) => u.id === currentUser.unit_id) || null;

  // Unidade selecionada para visualização
  const selectedUnit =
    selectedUnitId === "all" ? null : units.find((u) => u.id === selectedUnitId) || null;

  // Regra de Ouro: Admin tem permissão total.
  // Usuário comum só tem permissão de escrita se estiver na sua própria unidade.
  const canEdit =
    currentUser.role === "admin" ||
    (Boolean(currentUser.unit_id) && currentUser.unit_id === selectedUnitId);

  // Se o usuário está inspecionando uma unidade que não é a dele (e não é admin)
  const isViewingOtherUnit =
    currentUser.role !== "admin" &&
    selectedUnitId !== "all" &&
    currentUser.unit_id !== selectedUnitId;

  // Mutação: Adicionar Paciente (Gravado no Supabase + Cache Local)
  const addPatient = (patientData: Omit<Patient, "id" | "created_at">): Patient => {
    const newId = generateUUID();
    const newPatient: Patient = {
      ...patientData,
      id: newId,
      created_at: new Date().toISOString(),
    };

    setPatients((prev) => [newPatient, ...prev]);

    if (isSupabaseConfigured && supabase) {
      supabase
        .from("patients")
        .insert({
          id: newPatient.id,
          unit_id: newPatient.unit_id,
          cpf: newPatient.cpf,
          cns: newPatient.cns || null,
          full_name: newPatient.full_name,
          birth_date: newPatient.birth_date || null,
          phone: newPatient.phone || null,
          status: newPatient.status,
          created_by:
            currentUser.id && currentUser.id.includes("-") ? currentUser.id : null,
        })
        .then(({ error }) => {
          if (error) console.error("Erro ao salvar paciente no Supabase:", error);
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

    if (isSupabaseConfigured && supabase) {
      supabase
        .from("patients")
        .update(patch)
        .eq("id", id)
        .then(({ error }) => {
          if (error) console.error("Erro ao atualizar paciente no Supabase:", error);
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
    if (isSupabaseConfigured && client) {
      client
        .from("consultations")
        .insert({
          id: newConsultation.id,
          unit_id: newConsultation.unit_id,
          patient_id: newConsultation.patient_id,
          pharmacist_id:
            newConsultation.pharmacist_id && newConsultation.pharmacist_id.includes("-")
              ? newConsultation.pharmacist_id
              : currentUser.id,
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

    if (isSupabaseConfigured && supabase) {
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
              currentUser.id && currentUser.id.includes("-") ? currentUser.id : null,
          },
          { onConflict: "unit_id,year,month" }
        )
        .then(({ error }) => {
          if (error) console.error("Erro ao gravar dados complementares no Supabase:", error);
        });
    }
  };

  // Regra de Administração: apenas admin gerencia CIDs e Medicamentos
  const canManageCatalogs = currentUser.role === "admin";

  const addCID = (cid: Omit<CID, "id">): CID => {
    if (!canManageCatalogs) {
      throw new Error("Permissão negada: apenas administradores podem cadastrar CIDs.");
    }
    const newId = generateUUID();
    const newCid: CID = {
      ...cid,
      id: newId,
      created_at: new Date().toISOString(),
    };
    setCids((prev) => [newCid, ...prev]);

    if (isSupabaseConfigured && supabase) {
      supabase
        .from("cids")
        .insert({
          id: newCid.id,
          code: newCid.code,
          description: newCid.description,
          active: newCid.active,
        })
        .then(({ error }) => {
          if (error) console.error("Erro ao salvar CID no Supabase:", error);
        });
    }

    return newCid;
  };

  const addMedication = (med: Omit<Medication, "id">): Medication => {
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
      supabase
        .from("medications")
        .insert({
          id: newMed.id,
          sigtap_code: newMed.sigtap_code || null,
          name: newMed.name,
          pharmaceutical_form: newMed.pharmaceutical_form || null,
          component: "CEAF",
          active: newMed.active,
        })
        .then(({ error }) => {
          if (error) console.error("Erro ao salvar medicamento no Supabase:", error);
        });
    }

    return newMed;
  };

  const addUnit = (unit: Omit<Unit, "id">): Unit => {
    const newId = generateUUID();
    const newUnit: Unit = {
      ...unit,
      id: newId,
      created_at: new Date().toISOString(),
    };
    setUnits((prev) => [...prev, newUnit]);

    if (isSupabaseConfigured && supabase) {
      supabase
        .from("units")
        .insert({
          id: newUnit.id,
          name: newUnit.name,
          macroregion: newUnit.macroregion,
          cnes: newUnit.cnes || null,
          municipality: newUnit.municipality || null,
          active: newUnit.active,
        })
        .then(({ error }) => {
          if (error) console.error("Erro ao salvar unidade no Supabase:", error);
        });
    }

    return newUnit;
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

  // Restaurar Catálogo Base Oficial CEAF
  const resetCatalogsToOfficialCEAF = () => {
    setCids(INITIAL_CIDS);
    setMedications(INITIAL_MEDICATIONS);
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
    setCids(INITIAL_CIDS);
    setMedications(INITIAL_MEDICATIONS);
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
        setCurrentUser,
        setSelectedUnitId,
        addPatient,
        updatePatient,
        addConsultation,
        updateMonthlyData,
        addCID,
        addMedication,
        addUnit,
        importSIGTAPData,
        resetCatalogsToOfficialCEAF,
        clearSimulatedData,
        restoreDemoData,
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
