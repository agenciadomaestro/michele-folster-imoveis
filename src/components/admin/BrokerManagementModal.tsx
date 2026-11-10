import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Shield,
  KeyRound,
  Plus,
  Check,
  X,
  Mail,
  Phone,
  Building,
  UserCheck,
  UserX,
  Sliders,
  Trash2,
  AlertTriangle,
  Loader2,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  type Broker,
  type BrokerPermissions,
  fetchBrokers,
  saveBrokerDirect,
  updateBrokerPermissions,
  updateBrokerStatus,
  reassignAndDeleteBroker,
  formatMembershipDuration,
  MICHELE_BROKER_ID,
} from "@/lib/brokers";
import { type Property } from "@/lib/realty";

interface BrokerManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties?: Property[];
  onBrokersUpdated?: () => void;
}

export function BrokerManagementModal({
  isOpen,
  onClose,
  properties = [],
  onBrokersUpdated,
}: BrokerManagementModalProps) {
  const queryClient = useQueryClient();
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [selectedBroker, setSelectedBroker] = useState<Broker | null>(null);
  const [isEditingPermissions, setIsEditingPermissions] = useState(false);
  const [isNewBrokerModalOpen, setIsNewBrokerModalOpen] = useState(false);

  // Sincronização inicial e listener em tempo real no Supabase profiles
  useEffect(() => {
    if (!isOpen) return;

    fetchBrokers(false).then((list) => {
      setBrokers(list);
    });

    const channel = supabase
      .channel("broker-modal-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        async () => {
          const updatedList = await fetchBrokers(false);
          setBrokers(updatedList);
          queryClient.invalidateQueries({ queryKey: ["admin", "brokers-list"] });
          queryClient.invalidateQueries({ queryKey: ["admin", "active-brokers"] });
          if (onBrokersUpdated) onBrokersUpdated();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, queryClient]);

  // Estado para exclusão e reatribuição de corretor
  const [brokerToDelete, setBrokerToDelete] = useState<Broker | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Formulário de Novo Corretor / Redefinição de Credenciais
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formCreci, setFormCreci] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<"admin" | "corretor">("corretor");

  if (!isOpen) return null;

  const refreshList = async () => {
    const list = await fetchBrokers(false);
    setBrokers(list);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin", "brokers-list"] }),
      queryClient.invalidateQueries({ queryKey: ["admin", "active-brokers"] }),
      queryClient.invalidateQueries({ queryKey: ["admin", "current-user-profile"] }),
    ]);
    if (onBrokersUpdated) {
      await onBrokersUpdated();
    }
  };

  const getAssignedCount = (brokerId: string, brokerName: string) => {
    return properties.filter(
      (p) =>
        p.broker_id === brokerId ||
        (p.broker_id === null && brokerName.toLowerCase().includes("michele"))
    ).length;
  };

  const handleToggleActive = async (broker: Broker) => {
    const nextState = !broker.active;
    try {
      await updateBrokerStatus(broker.id, nextState);
      toast.success(`Corretor ${broker.name} marcado como ${nextState ? "Ativo" : "Inativo"}.`);
      refreshList();
    } catch (err: any) {
      toast.error(err?.message || "Falha ao alterar status do corretor.");
    }
  };

  const handleOpenPermissions = (broker: Broker) => {
    setSelectedBroker(broker);
    setIsEditingPermissions(true);
  };

  const handleTogglePermission = async (key: keyof BrokerPermissions) => {
    if (!selectedBroker) return;
    const currentVal = selectedBroker.permissions[key];
    const nextVal = !currentVal;

    try {
      await updateBrokerPermissions(selectedBroker.id, { [key]: nextVal });

      const updated = {
        ...selectedBroker,
        permissions: {
          ...selectedBroker.permissions,
          [key]: nextVal,
        },
      };
      setSelectedBroker(updated);
      refreshList();
      toast.success("Permissão atualizada com sucesso.");
    } catch (err: any) {
      toast.error(err?.message || "Falha ao atualizar permissão.");
    }
  };

  const handleCreateBroker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) {
      toast.error("Preencha ao menos Nome e E-mail.");
      return;
    }

    const newBrokerId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `c011e701-9999-4000-8000-${Date.now().toString().slice(-12).padStart(12, "0")}`;

    const newBroker: Broker = {
      id: newBrokerId,
      name: formName.trim(),
      email: formEmail.trim().toLowerCase(),
      phone: formPhone.trim() || "(12) 98146-7549",
      creci: formCreci.trim() || "Em processo",
      role: formRole,
      active: true,
      is_hidden: false,
      permissions: {
        pode_cadastrar_imovel: true,
        pode_ver_ofertas_gerais: formRole === "admin",
        pode_ver_captacoes: formRole === "admin",
      },
      created_at: new Date().toISOString(),
    };

    try {
      await saveBrokerDirect(newBroker);
      toast.success(`Corretor ${formName} cadastrado com sucesso!`);
      if (formPassword.trim()) {
        toast.info(`Credenciais criadas para ${formEmail}. Senha temporária configurada.`);
      }

      // Reset formulário
      setFormName("");
      setFormEmail("");
      setFormPhone("");
      setFormCreci("");
      setFormPassword("");
      setFormRole("corretor");
      setIsNewBrokerModalOpen(false);
      refreshList();
    } catch (err: any) {
      toast.error(err?.message || "Falha ao cadastrar corretor no Supabase.");
    }
  };

  // Confirmação de exclusão com reatribuição automática
  const handleConfirmDelete = async () => {
    if (!brokerToDelete) return;
    setIsDeleting(true);

    try {
      const { reassignedProps, reassignedLeads } = await reassignAndDeleteBroker(
        brokerToDelete.id,
        brokerToDelete.name
      );

      toast.success(
        `Corretor(a) ${brokerToDelete.name} excluído(a) com sucesso! ${
          reassignedProps > 0 || reassignedLeads > 0
            ? `${reassignedProps} imóveis e ${reassignedLeads} leads foram reatribuídos para Michele Folster.`
            : "Todos os vínculos foram transferidos para Michele Folster."
        }`
      );

      setBrokerToDelete(null);
      if (selectedBroker?.id === brokerToDelete.id) {
        setIsEditingPermissions(false);
        setSelectedBroker(null);
      }
      await refreshList();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["properties"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "properties-list"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "leads-crm-list"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "crm-leads-list"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "messages-leads-list"] }),
      ]);
    } catch (err: any) {
      console.error("Erro ao excluir no Supabase:", err);
      toast.error(err?.message || "Falha ao excluir corretor.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      {/* Container do Modal Ampliado para max-w-6xl */}
      <div className="relative w-full max-w-6xl rounded-2xl bg-surface border border-border shadow-2xl p-6 md:p-8 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-xl bg-accent text-primary">
              <Users className="size-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Gestão de Corretores e Permissões</h2>
              <p className="text-xs text-muted-foreground">
                Cadastre corretores, controle status, gerencie permissões ou reatribua vínculos da equipe.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsNewBrokerModalOpen(true)}
              className="btn btn-primary text-xs h-9 gap-1.5 shadow-xs"
            >
              <Plus className="size-4" />
              <span>Novo Corretor</span>
            </button>
            <button
              onClick={onClose}
              className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="py-6 overflow-y-auto flex-1 space-y-6">
          {/* Tabela de Corretores com formatação ampla e sem quebra de linhas */}
          <div className="overflow-x-auto rounded-xl border border-border shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/70 text-muted-foreground uppercase font-semibold text-[10px] tracking-wider border-b border-border">
                <tr>
                  <th className="py-3 px-4 min-w-[220px]">Corretor</th>
                  <th className="py-3 px-4 whitespace-nowrap min-w-[170px]">Contato</th>
                  <th className="py-3 px-4 whitespace-nowrap min-w-[120px]">CRECI</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap min-w-[140px]">
                    Imóveis Atribuídos
                  </th>
                  <th className="py-3 px-4 text-center whitespace-nowrap min-w-[100px]">Status</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap min-w-[180px]">
                    Permissões & Acesso
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {brokers.map((broker) => {
                  const assignedCount = getAssignedCount(broker.id, broker.name);
                  const isMichelePrincipal =
                    broker.id === MICHELE_BROKER_ID ||
                    broker.id === "corretor-michele" ||
                    broker.email.toLowerCase() === "michele@michelefolster.com.br" ||
                    broker.role === "admin";

                  return (
                    <tr key={broker.id} className="hover:bg-secondary/20 transition-colors">
                      {/* Corretor & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-full overflow-hidden bg-accent border border-border/80 shrink-0">
                            {broker.photo_url ? (
                              <img
                                src={broker.photo_url}
                                alt={broker.name}
                                className="size-full object-cover"
                              />
                            ) : (
                              <div className="grid size-full place-items-center font-bold text-primary text-xs">
                                {broker.name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground text-sm flex items-center gap-1.5 truncate">
                              <span>{broker.name}</span>
                              {isMichelePrincipal && (
                                <span className="chip text-[10px] bg-primary/10 text-primary border-primary/20 h-4 px-1.5 font-bold shrink-0">
                                  Gestora / Admin
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1 truncate">
                              <Mail className="size-3 shrink-0" />
                              <span className="truncate">{broker.email}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Contato (Linha única garantida com whitespace-nowrap) */}
                      <td className="py-3.5 px-4 font-mono text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <Phone className="size-3.5 text-primary shrink-0" />
                          <span className="whitespace-nowrap font-semibold text-foreground text-xs">
                            {broker.phone}
                          </span>
                        </div>
                      </td>

                      {/* CRECI (Linha única garantida com whitespace-nowrap) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono font-medium text-foreground bg-secondary px-2.5 py-1 rounded whitespace-nowrap inline-block">
                          {broker.creci || "Sem CRECI"}
                        </span>
                      </td>

                      {/* Imóveis Atribuídos */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 font-bold text-foreground bg-accent/70 px-3 py-1 rounded-full text-xs">
                          <Building className="size-3.5 text-primary shrink-0" />
                          <span>{assignedCount} {assignedCount === 1 ? "imóvel" : "imóveis"}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleToggleActive(broker)}
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                            broker.active
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-200"
                              : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 hover:bg-rose-200"
                          }`}
                        >
                          {broker.active ? (
                            <>
                              <UserCheck className="size-3" /> Ativo
                            </>
                          ) : (
                            <>
                              <UserX className="size-3" /> Inativo
                            </>
                          )}
                        </button>
                      </td>

                      {/* Permissões & Ação de Apagar */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenPermissions(broker)}
                            className="btn btn-outline text-xs h-8 gap-1.5"
                            title="Configurar permissões"
                          >
                            <Sliders className="size-3.5 text-primary" />
                            <span>Configurar</span>
                          </button>

                          {/* Botão Apagar / Excluir (Oculto/desabilitado para Michele Folster) */}
                          {isMichelePrincipal ? (
                            <div
                              className="grid size-8 place-items-center rounded-lg text-muted-foreground/30 cursor-not-allowed"
                              title="Usuário gestor principal não pode ser excluído"
                            >
                              <Trash2 className="size-3.5" />
                            </div>
                          ) : (
                            <button
                              onClick={() => setBrokerToDelete(broker)}
                              className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600 transition-colors"
                              title={`Excluir corretor(a) ${broker.name}`}
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Sub-painel de Configuração de Permissões */}
          {isEditingPermissions && selectedBroker && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-3 border-b border-primary/20">
                <div className="flex items-center gap-2">
                  <Shield className="size-5 text-primary" />
                  <h3 className="font-bold text-sm text-foreground">
                    Permissões de Acesso:{" "}
                    <span className="text-primary font-extrabold">{selectedBroker.name}</span>
                  </h3>
                </div>
                <button
                  onClick={() => setIsEditingPermissions(false)}
                  className="text-xs text-muted-foreground hover:text-foreground font-semibold"
                >
                  Fechar Configuração
                </button>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {/* Switch 1: Pode cadastrar/editar imóveis */}
                <div
                  onClick={() => handleTogglePermission("pode_cadastrar_imovel")}
                  className={`cursor-pointer rounded-xl border p-4 transition-all ${
                    selectedBroker.permissions.pode_cadastrar_imovel
                      ? "bg-surface border-primary shadow-xs"
                      : "bg-surface/60 border-border opacity-70"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">Cadastrar/Editar Imóveis</span>
                    <span
                      className={`grid size-5 place-items-center rounded-full text-white text-[10px] ${
                        selectedBroker.permissions.pode_cadastrar_imovel
                          ? "bg-primary"
                          : "bg-muted-foreground/40"
                      }`}
                    >
                      {selectedBroker.permissions.pode_cadastrar_imovel ? (
                        <Check className="size-3" />
                      ) : (
                        <X className="size-3" />
                      )}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[11px] text-muted-foreground leading-relaxed">
                    Permite ou bloqueia a inclusão e alteração de imóveis no sistema pelo corretor.
                  </p>
                </div>

                {/* Switch 2: Pode visualizar ofertas gerais */}
                <div
                  onClick={() => handleTogglePermission("pode_ver_ofertas_gerais")}
                  className={`cursor-pointer rounded-xl border p-4 transition-all ${
                    selectedBroker.permissions.pode_ver_ofertas_gerais
                      ? "bg-surface border-primary shadow-xs"
                      : "bg-surface/60 border-border opacity-70"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">Ver Ofertas & Leads Gerais</span>
                    <span
                      className={`grid size-5 place-items-center rounded-full text-white text-[10px] ${
                        selectedBroker.permissions.pode_ver_ofertas_gerais
                          ? "bg-primary"
                          : "bg-muted-foreground/40"
                      }`}
                    >
                      {selectedBroker.permissions.pode_ver_ofertas_gerais ? (
                        <Check className="size-3" />
                      ) : (
                        <X className="size-3" />
                      )}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[11px] text-muted-foreground leading-relaxed">
                    Se desativado, o corretor vê apenas os imóveis e leads atribuídos exclusivamente a ele.
                  </p>
                </div>

                {/* Switch 3: Pode visualizar captações */}
                <div
                  onClick={() => handleTogglePermission("pode_ver_captacoes")}
                  className={`cursor-pointer rounded-xl border p-4 transition-all ${
                    selectedBroker.permissions.pode_ver_captacoes
                      ? "bg-surface border-primary shadow-xs"
                      : "bg-surface/60 border-border opacity-70"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">Ver Captações (Anuncie)</span>
                    <span
                      className={`grid size-5 place-items-center rounded-full text-white text-[10px] ${
                        selectedBroker.permissions.pode_ver_captacoes
                          ? "bg-primary"
                          : "bg-muted-foreground/40"
                      }`}
                    >
                      {selectedBroker.permissions.pode_ver_captacoes ? (
                        <Check className="size-3" />
                      ) : (
                        <X className="size-3" />
                      )}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[11px] text-muted-foreground leading-relaxed">
                    Permite visualizar formulários enviados por proprietários na página "Anuncie seu imóvel".
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal de Confirmação de Exclusão com Reatribuição */}
        {brokerToDelete && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="w-full max-w-lg rounded-2xl bg-surface border border-border p-6 md:p-8 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
              <div className="flex items-start gap-3.5">
                <div className="grid size-12 place-items-center rounded-2xl bg-rose-500/10 text-rose-600 shrink-0">
                  <AlertTriangle className="size-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    Excluir Corretor(a) {brokerToDelete.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Revise as informações de impacto e confirme a transferência dos dados.
                  </p>
                </div>
              </div>

              {/* Resumo de Impacto */}
              <div className="grid grid-cols-2 gap-3 rounded-xl bg-secondary/50 p-4 border border-border">
                <div>
                  <p className="text-[11px] text-muted-foreground font-medium">Imóveis Atribuídos</p>
                  <p className="text-base font-bold text-foreground mt-0.5 flex items-center gap-1.5">
                    <Building className="size-4 text-primary" />
                    <span>
                      {getAssignedCount(brokerToDelete.id, brokerToDelete.name)}{" "}
                      {getAssignedCount(brokerToDelete.id, brokerToDelete.name) === 1
                        ? "imóvel"
                        : "imóveis"}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground font-medium">Tempo de Cadastro</p>
                  <p className="text-base font-bold text-foreground mt-0.5 flex items-center gap-1.5">
                    <Clock className="size-4 text-primary" />
                    <span>{formatMembershipDuration(brokerToDelete.created_at)}</span>
                  </p>
                </div>
              </div>

              {/* Mensagem de Alerta em Destaque */}
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                <p className="text-xs leading-relaxed text-amber-900 dark:text-amber-200 font-medium">
                  <strong>Aviso de integridade:</strong> Esta ação <u>não apagará</u> os imóveis ou
                  captações cadastrados por este corretor. Todos os imóveis, leads e históricos de
                  contato vinculados a ele serão <strong>automaticamente reatribuídos para a gestora Michele Folster</strong>.
                </p>
              </div>

              {/* Ações */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setBrokerToDelete(null)}
                  className="btn btn-ghost text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="btn bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold gap-2 shadow-xs"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Excluindo e Reatribuindo...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="size-4" />
                      <span>Confirmar Exclusão</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Cadastro de Novo Corretor */}
        {isNewBrokerModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-md rounded-2xl bg-surface border border-border p-6 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                  <KeyRound className="size-4 text-primary" />
                  Cadastrar Corretor e Credenciais
                </h3>
                <button
                  onClick={() => setIsNewBrokerModalOpen(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>

              <form onSubmit={handleCreateBroker} className="mt-4 space-y-3.5">
                <div>
                  <label className="label">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex: João da Silva"
                    className="field"
                  />
                </div>

                <div>
                  <label className="label">E-mail de Acesso</label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="joao@michelefolster.com.br"
                    className="field"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">WhatsApp</label>
                    <input
                      type="text"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="(12) 99999-9999"
                      className="field"
                    />
                  </div>
                  <div>
                    <label className="label">CRECI</label>
                    <input
                      type="text"
                      value={formCreci}
                      onChange={(e) => setFormCreci(e.target.value)}
                      placeholder="123456-F"
                      className="field"
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Nível de Função</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as any)}
                    className="field"
                  >
                    <option value="corretor">Corretor Padrão</option>
                    <option value="admin">Administrador / Gestor</option>
                  </select>
                </div>

                <div>
                  <label className="label">Senha Provisória</label>
                  <input
                    type="password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="••••••••"
                    className="field"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    O corretor poderá utilizar esta senha para acessar o painel.
                  </p>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsNewBrokerModalOpen(false)}
                    className="btn btn-ghost text-xs"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary text-xs">
                    Salvar Corretor
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
