"use client";

import React, { useState } from "react";
import {
  Building2,
  PlusCircle,
  Users,
  Shield,
  MapPin,
  CheckCircle,
  UserCheck,
} from "lucide-react";
import { useApp } from "@/lib/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Role } from "@/lib/types";

export default function UnidadesPage() {
  const { units, profiles, currentUser, addUnit } = useApp();

  const [activeTab, setActiveTab] = useState<"units" | "users">("units");
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);

  // Estados formulário Unidade
  const [unitName, setUnitName] = useState("");
  const [macroregion, setMacroregion] = useState("Macrorregional Norte");
  const [municipality, setMunicipality] = useState("");
  const [cnes, setCnes] = useState("");

  const handleSaveUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitName.trim() || !macroregion.trim()) return;

    addUnit({
      name: unitName.trim(),
      macroregion: macroregion.trim(),
      municipality: municipality.trim() || undefined,
      cnes: cnes.trim() || undefined,
      active: true,
    });

    setIsUnitModalOpen(false);
    setUnitName("");
    setMunicipality("");
    setCnes("");
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E7EB]">
        <div>
          <h1 className="text-2xl font-bold text-[#171A20] tracking-tight">
            Gestão de Unidades & Vínculos de Usuários
          </h1>
          <p className="text-xs text-[#5C5E62] mt-0.5">
            Configuração das Bases Regionais de Saúde (BRS), núcleos e lotação dos farmacêuticos.
          </p>
        </div>

        <div>
          {activeTab === "units" && (
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsUnitModalOpen(true)}
            >
              <PlusCircle className="w-4 h-4 mr-1.5" />
              Cadastrar Nova Unidade
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E5E7EB] space-x-4">
        <button
          onClick={() => setActiveTab("units")}
          className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "units"
              ? "border-[#171A20] text-[#171A20]"
              : "border-transparent text-[#5C5E62] hover:text-[#171A20]"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Unidades de Saúde (BRS)</span>
          <Badge variant="neutral">{units.length}</Badge>
        </button>

        <button
          onClick={() => setActiveTab("users")}
          className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "users"
              ? "border-[#171A20] text-[#171A20]"
              : "border-transparent text-[#5C5E62] hover:text-[#171A20]"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Usuários & Lotação</span>
          <Badge variant="neutral">{profiles.length}</Badge>
        </button>
      </div>

      {/* Aba de Unidades */}
      {activeTab === "units" && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#171A20] text-white border-b border-[#282C34]">
                    <th className="py-2.5 px-4 font-semibold">Nome da Unidade / BRS</th>
                    <th className="py-2.5 px-4 font-semibold">Macrorregional de Saúde</th>
                    <th className="py-2.5 px-4 font-semibold">Município</th>
                    <th className="py-2.5 px-4 font-semibold">CNES</th>
                    <th className="py-2.5 px-4 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB] bg-white">
                  {units.map((u) => (
                    <tr key={u.id} className="hover:bg-[#F9FAFB] transition-colors">
                      <td className="py-3 px-4 font-semibold text-[#171A20]">
                        {u.name}
                      </td>
                      <td className="py-3 px-4 text-[#5C5E62]">
                        {u.macroregion}
                      </td>
                      <td className="py-3 px-4 text-[#171A20]">
                        {u.municipality || "—"}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#5C5E62]">
                        {u.cnes || "—"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant="success">Ativa</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Aba de Usuários */}
      {activeTab === "users" && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#171A20] text-white border-b border-[#282C34]">
                    <th className="py-2.5 px-4 font-semibold">Nome do Profissional</th>
                    <th className="py-2.5 px-4 font-semibold">E-mail Institucional</th>
                    <th className="py-2.5 px-4 font-semibold">CRF</th>
                    <th className="py-2.5 px-4 font-semibold">Unidade Vinculada</th>
                    <th className="py-2.5 px-4 font-semibold text-center">Papel (Role)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB] bg-white">
                  {profiles.map((p) => {
                    const unit = units.find((u) => u.id === p.unit_id);
                    return (
                      <tr key={p.id} className="hover:bg-[#F9FAFB] transition-colors">
                        <td className="py-3 px-4 font-semibold text-[#171A20]">
                          {p.full_name}
                        </td>
                        <td className="py-3 px-4 font-mono text-[#5C5E62]">
                          {p.email}
                        </td>
                        <td className="py-3 px-4 font-mono text-[#171A20]">
                          {p.crf || "—"}
                        </td>
                        <td className="py-3 px-4 text-[#171A20]">
                          {unit ? unit.name : <span className="text-[#9CA3AF]">Acesso Geral (Sem unidade fixa)</span>}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge
                            variant={
                              p.role === "admin"
                                ? "default"
                                : p.role === "pharmacist"
                                ? "success"
                                : "neutral"
                            }
                          >
                            {p.role === "admin"
                              ? "Admin Geral"
                              : p.role === "pharmacist"
                              ? "Farmacêutico"
                              : "Visualizador"}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal Nova Unidade */}
      <Dialog
        open={isUnitModalOpen}
        onOpenChange={setIsUnitModalOpen}
        title="Cadastrar Nova Unidade de Saúde"
        description="Adicione uma nova base regional de saúde à rede do Cuidado Farmacêutico."
      >
        <form onSubmit={handleSaveUnit} className="space-y-4">
          <Input
            label="Nome da Unidade / Núcleo *"
            placeholder="Ex: BRS Barreiras"
            value={unitName}
            onChange={(e) => setUnitName(e.target.value)}
            required
          />

          <div>
            <label className="text-xs font-semibold text-[#393C41] block mb-1">
              Macrorregional de Saúde *
            </label>
            <select
              value={macroregion}
              onChange={(e) => setMacroregion(e.target.value)}
              className="w-full h-9 px-3 text-xs bg-white border border-[#D1D5DB] rounded focus:outline-none"
              required
            >
              <option value="Macrorregional Norte">Macrorregional Norte</option>
              <option value="Macrorregional Centro-Leste">Macrorregional Centro-Leste</option>
              <option value="Macrorregional Sudoeste">Macrorregional Sudoeste</option>
              <option value="Macrorregional Leste">Macrorregional Leste</option>
              <option value="Macrorregional Oeste">Macrorregional Oeste</option>
              <option value="Macrorregional Sul">Macrorregional Sul</option>
              <option value="Macrorregional Extremo-Sul">Macrorregional Extremo-Sul</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Município-Sede"
              placeholder="Ex: Barreiras"
              value={municipality}
              onChange={(e) => setMunicipality(e.target.value)}
            />
            <Input
              label="Código CNES"
              placeholder="Ex: 2801452"
              value={cnes}
              onChange={(e) => setCnes(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsUnitModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Salvar Unidade
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
