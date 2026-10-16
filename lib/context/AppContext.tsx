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
  Role,
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
    role: "pharmacist" | "admin" | "viewer";
  }) => Promise<{ success: boolean; error?: string }>;
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

  const [isSupabaseOnline, setIsSupabaseOnline] = useState<boolean>(isSupabaseConfigured);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const [isDemoMode, setIsDemoMode] = useState<boolean>(() =>
    getStoredOrDefault("isDemoMode", false)
  );

  // Usuário ativo no sistema (se não estiver em modo demo e não houver login, inicia como null)
  const [currentUser, setCurrentUser] = useState<Profile | null>(() => {
    const isDemo = getStoredOrDefault("isDemoMode", false);
    if (isDemo) {
      return getStoredOrDefault<Profile | null>("currentUser", INITIAL_PROFILES[0]);
    }
    return getStoredOrDefault<Profile | null>("currentUser", null);
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const isDemo = getStoredOrDefault("isDemoMode", false);
    if (isDemo) return true;
    const storedUser = getStoredOrDefault<Profile | null>("currentUser", null);
    return Boolean(storedUser);
  });

  const [authChecked, setAuthChecked] = useState<boolean>(false);

  // Unidade sendo visualizada (padrão a própria unidade do usuário ou 'all' para administradores)
  const [selectedUnitId, setSelectedUnitId] = useState<string>(() => {
    const storedUser = getStoredOrDefault<Profile | null>("currentUser", null);
    if (!storedUser || storedUser.role === "admin" || !storedUser.unit_id) {
      return "all";
    }
    return storedUser.unit_id;
  });

  // Sincronização e Carga de dados a partir do Supabase
  const refreshFromSupabase = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      setIsSyncing(true);

      // 1. Unidades, CIDs, Medicamentos e Profiles (Metadados públicos/cadastrais de referência)
      const [unitsRes, cidsRes, medsRes, relsRes, profilesRes] = await Promise.all([
        supabase.from("units").select("*").order("name"),
        supabase.from("cids").select("*").order("code"),
        supabase.from("medications").select("*").order("name"),
        supabase.from("medication_authorized_cids").select("sigtap_code, cid_code"),
        supabase.from("profiles").select("*"),
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

      // 2. Dados Sensíveis (Pacientes, Consultas, Fechamento Mensal):
      // NUNCA carregar se estiver em modo de demonstração ou se não houver usuário autenticado no Supabase
      const isDemo = getStoredOrDefault("isDemoMode", false);
      if (!isDemo) {
        const { data: authData } = await supabase.auth.getSession();
        if (authData?.session) {
          const [patsRes, consRes, monthlyRes] = await Promise.all([
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

          setPatients(patsRes.data || []);

          if (consRes.data) {
            const mappedCons: Consultation[] = consRes.data.map((c: any) => ({
              ...c,
              medications: (c.consultation_medications || [])
                .map((cm: any) => cm.medications)
                .filter(Boolean),
              prfs: c.consultation_prfs || [],
            }));
            setConsultations(mappedCons);
          } else {
            setConsultations([]);
          }

          setMonthlyData(monthlyRes.data || []);
        } else {
          setPatients([]);
          setConsultations([]);
          setMonthlyData([]);
        }
      }

      setIsSupabaseOnline(true);
    } catch (err) {
      console.warn("Supabase fetch error, maintaining local state cache:", err);
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
            const { data: dbProfile } = await supabase
              .from("profiles")
              .select("*, unit:units(*)")
              .eq("email", session.user.email)
              .maybeSingle();

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
        const { data: dbProfile } = await client
          .from("profiles")
          .select("*")
          .eq("email", session.user.email)
          .maybeSingle();

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
  useEffect(() => saveToStorage("units", units), [units]);
  useEffect(() => saveToStorage("profiles", profiles), [profiles]);
  useEffect(() => saveToStorage("cids", cids), [cids]);
  useEffect(() => saveToStorage("medications", medications), [medications]);
  useEffect(() => {
    if (isDemoMode) {
      saveToStorage("patients", patients);
    }
  }, [patients, isDemoMode]);
  useEffect(() => {
    if (isDemoMode) {
      saveToStorage("consultations", consultations);
    }
  }, [consultations, isDemoMode]);
  useEffect(() => {
    if (isDemoMode) {
      saveToStorage("monthlyData", monthlyData);
    }
  }, [monthlyData, isDemoMode]);
  useEffect(() => saveToStorage("currentUser", currentUser), [currentUser]);
  useEffect(() => saveToStorage("isDemoMode", isDemoMode), [isDemoMode]);

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
        const { data: dbProfile } = await supabase
          .from("profiles")
          .select("*, unit:units(*)")
          .eq("email", data.user.email)
          .maybeSingle();

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
            unit_id: userMeta.unit_id || null,
            role: userMeta.role || "pharmacist",
          };
          await supabase.from("profiles").upsert(activeProfile);
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
      localStorage.removeItem("pharmacare_currentUser");
      localStorage.removeItem("pharmacare_isDemoMode");
      localStorage.removeItem("pharmacare_patients");
      localStorage.removeItem("pharmacare_consultations");
      localStorage.removeItem("pharmacare_monthlyData");
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
            currentUser?.id && currentUser.id.includes("-") ? currentUser.id : null,
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

    if (!isDemoMode && isSupabaseConfigured && supabase) {
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
    const newId = generateUUID();
    const newCid: CID = {
      ...cid,
      code: cid.code.toUpperCase().trim(),
      id: newId,
      created_at: new Date().toISOString(),
    };
    setCids((prev) => [newCid, ...prev.filter((c) => c.code !== newCid.code)]);

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from("cids").upsert(
          {
            code: newCid.code,
            description: newCid.description,
            active: newCid.active,
          },
          { onConflict: "code" }
        );
        if (error) console.error("Erro ao salvar CID no Supabase:", error);
        await refreshFromSupabase();
      } catch (e) {
        console.error("Falha ao persistir CID:", e);
      }
    }

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

    setCids((prev) =>
      prev.map((c) => (c.id === cidId ? { ...c, ...cidData } : c))
    );

    if (isSupabaseConfigured && supabase) {
      try {
        const updatePayload: Record<string, any> = {};
        if (cidData.code !== undefined) updatePayload.code = cidData.code.toUpperCase().trim();
        if (cidData.description !== undefined) updatePayload.description = cidData.description.trim();
        if (cidData.active !== undefined) updatePayload.active = cidData.active;

        const { error } = await supabase
          .from("cids")
          .update(updatePayload)
          .eq("id", cidId);

        if (error) {
          console.error("Erro ao atualizar CID no Supabase:", error);
          return { success: false, error: error.message };
        }
        await refreshFromSupabase();
        return { success: true };
      } catch (e: any) {
        console.error("Falha ao atualizar CID:", e);
        return { success: false, error: e.message || "Erro ao atualizar CID." };
      }
    }

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
        const { error } = await supabase.from("units").insert({
          id: newUnit.id,
          name: newUnit.name,
          macroregion: newUnit.macroregion,
          cnes: newUnit.cnes || null,
          municipality: newUnit.municipality || null,
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

      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase
          .from("units")
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
      if (userData.unit_id !== undefined) updatePayload.unit_id = userData.unit_id;
      if (userData.role !== undefined) updatePayload.role = userData.role;
      if (userData.active !== undefined) updatePayload.active = userData.active;

      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase
          .from("profiles")
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
    role: "pharmacist" | "admin" | "viewer";
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.rpc("admin_create_user", {
          p_email: userData.email.trim(),
          p_password: userData.password,
          p_full_name: userData.full_name.trim(),
          p_role: userData.role,
          p_crf: userData.crf?.trim() || null,
          p_unit_id: userData.unit_id || null,
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
