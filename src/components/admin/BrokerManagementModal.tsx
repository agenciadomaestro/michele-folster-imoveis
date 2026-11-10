import { useState } from "react";
import {
  Users,
  Shield,
  KeyRound,
  Plus,
  Check,
  X,
  Edit2,
  Mail,
  Phone,
  Building,
  UserCheck,
  UserX,
  Sliders,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  type Broker,
  type BrokerPermissions,
  getLocalBrokers,
  saveLocalBroker,
  updateBrokerPermissions,
  updateBrokerStatus,
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
  const [brokers, setBrokers] = useState<Broker[]>(() => getLocalBrokers(false));
  const [selectedBroker, setSelectedBroker] = useState<Broker | null>(null);
  const [isEditingPermissions, setIsEditingPermissions] = useState(false);
  const [isNewBrokerModalOpen, setIsNewBrokerModalOpen] = useState(false);

  // Formulário de Novo Corretor / Redefinição de Credenciais
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formCreci, setFormCreci] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<"admin" | "corretor">("corretor");

  if (!isOpen) return null;

  const refreshList = () => {
    const list = getLocalBrokers(false);
    setBrokers(list);
    if (onBrokersUpdated) onBrokersUpdated();
  };

  const getAssignedCount = (brokerId: string, brokerName: string) => {
    return properties.filter(
      (p) =>
        p.broker_id === brokerId ||
        (p.broker_id === null && brokerName.toLowerCase().includes("michele"))
    ).length;
  };

  const handleToggleActive = (broker: Broker) => {
    const nextState = !broker.active;
    updateBrokerStatus(broker.id, nextState);
    toast.success(`Corretor ${broker.name} marcado como ${nextState ? "Ativo" : "Inativo"}.`);
    refreshList();
  };

  const handleOpenPermissions = (broker: Broker) => {
    setSelectedBroker(broker);
    setIsEditingPermissions(true);
  };

  const handleTogglePermission = (key: keyof BrokerPermissions) => {
    if (!selectedBroker) return;
    const currentVal = selectedBroker.permissions[key];
    const nextVal = !currentVal;

    updateBrokerPermissions(selectedBroker.id, { [key]: nextVal });

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
  };

  const handleCreateBroker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) {
      toast.error("Preencha ao menos Nome e E-mail.");
      return;
    }

    const newBrokerId = `corretor-${Date.now()}`;
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

    saveLocalBroker(newBroker);
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
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl bg-surface border border-border shadow-2xl p-6 md:p-8 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-xl bg-accent text-primary">
              <Users className="size-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Gestão de Corretores e Permissões</h2>
              <p className="text-xs text-muted-foreground">
                Cadastre corretores, controle status e ajuste permissões individuais de acesso.
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
        <div className="py-6 overflow-y-auto flex-1">
          {/* Tabela de Corretores */}
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/60 text-muted-foreground uppercase font-semibold text-[10px] tracking-wider border-b border-border">
                <tr>
                  <th className="py-3 px-4">Corretor</th>
                  <th className="py-3 px-4">Contato</th>
                  <th className="py-3 px-4">CRECI</th>
                  <th className="py-3 px-4 text-center">Imóveis Atribuídos</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Permissões & Acesso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {brokers.map((broker) => {
                  const assignedCount = getAssignedCount(broker.id, broker.name);
                  return (
                    <tr key={broker.id} className="hover:bg-secondary/20 transition-colors">
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
                          <div>
                            <p className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                              {broker.name}
                              {broker.role === "admin" && (
                                <span className="chip text-[10px] bg-primary/10 text-primary border-primary/20 h-4 px-1.5 font-bold">
                                  Gestora / Admin
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <Mail className="size-3" />
                              {broker.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Phone className="size-3 text-primary" />
                          <span>{broker.phone}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-mono font-medium text-foreground bg-secondary px-2 py-0.5 rounded">
                          {broker.creci || "Sem CRECI"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 font-bold text-foreground bg-accent/70 px-2.5 py-0.5 rounded-full text-xs">
                          <Building className="size-3 text-primary" />
                          {assignedCount}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleActive(broker)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-colors ${
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

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenPermissions(broker)}
                          className="btn btn-outline text-xs h-8 gap-1.5"
                        >
                          <Sliders className="size-3.5 text-primary" />
                          <span>Configurar</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Sub-painel de Configuração de Permissões */}
          {isEditingPermissions && selectedBroker && (
            <div className="mt-6 rounded-xl border border-primary/30 bg-primary/5 p-5 animate-in fade-in slide-in-from-top-2">
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
                      {selectedBroker.permissions.pode_cadastrar_imovel ? <Check className="size-3" /> : <X className="size-3" />}
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
                      {selectedBroker.permissions.pode_ver_ofertas_gerais ? <Check className="size-3" /> : <X className="size-3" />}
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
                      {selectedBroker.permissions.pode_ver_captacoes ? <Check className="size-3" /> : <X className="size-3" />}
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
