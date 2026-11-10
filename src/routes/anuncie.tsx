import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Building2,
  Upload,
  CheckCircle2,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Camera,
  MapPin,
  TrendingUp,
  DollarSign,
  Phone,
} from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/SiteLayout";
import { saveMessageLead } from "@/lib/messages";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/anuncie")({
  head: () => ({
    meta: [
      { title: "Anuncie seu Imóvel — Michele Folster Imóveis" },
      {
        name: "description",
        content:
          "Venda ou alugue seu imóvel com exclusividade, consultoria jurídica e máxima valorização em Caçapava e região.",
      },
      { property: "og:title", content: "Anuncie seu Imóvel — Michele Folster Imóveis" },
      {
        property: "og:description",
        content:
          "Cadastre seu imóvel e receba atendimento personalizado de nossa equipe de corretores credenciados.",
      },
    ],
  }),
  component: AnunciePage,
});

function AnunciePage() {
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  // Form Fields
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [tipoImovel, setTipoImovel] = useState("Casa em Condomínio");
  const [cidadeBairro, setCidadeBairro] = useState("");
  const [valorPretendido, setValorPretendido] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !whatsapp.trim() || !tipoImovel) {
      toast.error("Por favor, preencha Nome, WhatsApp e Tipo de Imóvel.");
      return;
    }

    setSubmitting(true);

    let photoUrl: string | null = null;

    // 1. Upload da Foto para o Bucket 'captacoes' no Supabase se houver arquivo
    if (photoFile) {
      try {
        const fileExt = photoFile.name.split(".").pop();
        const fileName = `captacao-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("captacoes")
          .upload(fileName, photoFile);

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from("captacoes")
            .getPublicUrl(fileName);
          photoUrl = publicUrlData.publicUrl;
        }
      } catch (err) {
        console.warn("Aviso ao fazer upload da imagem no bucket captacoes:", err);
      }
    }

    // Se o upload remoto não foi concluído mas há preview local, utiliza no payload
    if (!photoUrl && photoPreview) {
      photoUrl = photoPreview;
    }

    // 2. Salva o registro em messages_leads e CRM
    try {
      await saveMessageLead({
        tipo: "captacao",
        nome_cliente: nome.trim(),
        telefone_cliente: whatsapp.trim(),
        email_cliente: email.trim() || null,
        interesse: "Anunciar meu imóvel",
        mensagem: observacoes.trim() || `Captação de imóvel (${tipoImovel}) em ${cidadeBairro || "Caçapava-SP"}. Valor pretendido: R$ ${valorPretendido || "A combinar"}.`,
        tipo_imovel: tipoImovel,
        cidade_bairro: cidadeBairro.trim() || "Caçapava-SP",
        valor_pretendido: valorPretendido ? Number(valorPretendido.replace(/\D/g, "")) : null,
        foto_imovel_url: photoUrl,
        corretor_atribuido_id: "corretor-michele", // Atribuição inicial padrão para a Michele
        corretor_nome: "Michele Folster",
      });
    } catch (err) {
      console.warn("Erro ao registrar captação:", err);
    }

    setSubmitting(false);
    setIsSuccess(true);
    toast.success("Solicitação recebida com sucesso!");

    // 3. Dispara a notificação direta para o WhatsApp oficial: 12981467549 com mensagem pré-formatada:
    // "Olá! Quero anunciar meu imóvel pelo site. Nome: [NOME] | Contato: [TELEFONE] | Tipo: [TIPO_IMOVEL]."
    const cleanPhone = "5512981467549";
    const waText = `Olá! Quero anunciar meu imóvel pelo site. Nome: ${nome.trim()} | Contato: ${whatsapp.trim()} | Tipo: ${tipoImovel}.`;
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waText)}`;

    // Abre o WhatsApp em nova aba
    window.open(waUrl, "_blank");
  };

  return (
    <SiteLayout>
      <div className="container-page pt-12 pb-20">
        {/* Hero Section */}
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <span className="chip bg-accent text-primary font-bold">
            Captação & Venda Exclusiva
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
            Anuncie seu Imóvel com a Michele Folster
          </h1>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
            Seu patrimônio nas mãos de quem conhece profundamente o mercado de Caçapava e o Vale do Paraíba.
            Divulgação estratégica, segurança jurídica e máxima velocidade de negociação.
          </p>
        </div>

        {/* 3 Pilares de Destaque */}
        <div className="mt-12 grid gap-6 sm:grid-cols-3 max-w-4xl mx-auto">
          <div className="panel p-5 text-center">
            <div className="grid size-12 place-items-center rounded-2xl bg-accent text-primary mx-auto mb-3">
              <TrendingUp className="size-6" />
            </div>
            <h3 className="font-bold text-sm text-foreground">Avaliação Justa de Mercado</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Estudo de mercado assertivo para precificar seu imóvel com precisão e atratividade.
            </p>
          </div>

          <div className="panel p-5 text-center">
            <div className="grid size-12 place-items-center rounded-2xl bg-accent text-primary mx-auto mb-3">
              <Sparkles className="size-6" />
            </div>
            <h3 className="font-bold text-sm text-foreground">Marketing Imobiliário Premium</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Fotos profissionais, anúncios destacados e presença forte nas mídias sociais.
            </p>
          </div>

          <div className="panel p-5 text-center">
            <div className="grid size-12 place-items-center rounded-2xl bg-accent text-primary mx-auto mb-3">
              <ShieldCheck className="size-6" />
            </div>
            <h3 className="font-bold text-sm text-foreground">Segurança Jurídica Total</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Acompanhamento documental completo desde a proposta até a entrega das chaves.
            </p>
          </div>
        </div>

        {/* Formulário Principal */}
        <div className="mt-12 max-w-2xl mx-auto">
          <div className="panel p-8 md:p-10 shadow-[var(--shadow-soft)]">
            {isSuccess ? (
              <div className="text-center py-8 space-y-4">
                <div className="grid size-16 place-items-center rounded-full bg-emerald-100 text-emerald-600 mx-auto">
                  <CheckCircle2 className="size-8" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">
                  Solicitação Enviada com Sucesso!
                </h2>
                <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                  Obrigado por confiar na Michele Folster Imóveis. Nossa equipe já recebeu seus dados e nossa
                  gestora entrará em contato via WhatsApp para combinar a avaliação do seu imóvel.
                </p>
                <div className="pt-4">
                  <button
                    onClick={() => {
                      setIsSuccess(false);
                      setNome("");
                      setWhatsapp("");
                      setEmail("");
                      setCidadeBairro("");
                      setValorPretendido("");
                      setObservacoes("");
                      setPhotoPreview(null);
                      setPhotoFile(null);
                    }}
                    className="btn btn-outline text-xs"
                  >
                    Cadastrar outro imóvel
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="border-b border-border pb-4">
                  <h2 className="text-xl font-bold text-foreground">Dados do Proprietário & Imóvel</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Preencha as informações para iniciar a divulgação do seu imóvel.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="label">Nome Completo *</label>
                    <input
                      type="text"
                      required
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Ex: Carlos Eduardo de Oliveira"
                      className="field"
                    />
                  </div>

                  <div>
                    <label className="label">WhatsApp / Telefone *</label>
                    <input
                      type="tel"
                      required
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="(12) 99999-9999"
                      className="field"
                    />
                  </div>

                  <div>
                    <label className="label">E-mail (Opcional)</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seuemail@exemplo.com"
                      className="field"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label">Tipo de Imóvel *</label>
                    <select
                      value={tipoImovel}
                      onChange={(e) => setTipoImovel(e.target.value)}
                      className="field"
                    >
                      <option value="Casa em Condomínio">Casa em Condomínio</option>
                      <option value="Casa Térrea / Sobrado">Casa Térrea / Sobrado</option>
                      <option value="Apartamento">Apartamento</option>
                      <option value="Terreno / Lote">Terreno / Lote</option>
                      <option value="Ponto Comercial / Sala">Ponto Comercial / Sala</option>
                      <option value="Galpão Industrial">Galpão Industrial</option>
                      <option value="Chácara / Sítio">Chácara / Sítio</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>

                  <div>
                    <label className="label">Cidade e Bairro</label>
                    <input
                      type="text"
                      value={cidadeBairro}
                      onChange={(e) => setCidadeBairro(e.target.value)}
                      placeholder="Ex: Caçapava - Terras do Vale"
                      className="field"
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Valor Pretendido de Venda / Aluguel (R$)</label>
                  <input
                    type="text"
                    value={valorPretendido}
                    onChange={(e) => setValorPretendido(e.target.value)}
                    placeholder="Ex: 850.000"
                    className="field"
                  />
                </div>

                {/* Upload de Foto do Imóvel (Bucket captacoes) */}
                <div>
                  <label className="label flex items-center justify-between">
                    <span>Foto do Imóvel (Opcional)</span>
                    <span className="text-[10px] text-muted-foreground">JPG, PNG até 10MB</span>
                  </label>
                  <div className="mt-1 flex items-center gap-4">
                    <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border p-4 text-xs font-semibold text-muted-foreground hover:bg-secondary/40 hover:text-foreground transition-colors">
                      <Camera className="size-4 text-primary" />
                      <span>{photoFile ? photoFile.name : "Selecionar foto do imóvel"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoChange}
                      />
                    </label>

                    {photoPreview && (
                      <div className="size-14 rounded-xl overflow-hidden border border-border shrink-0 bg-secondary">
                        <img
                          src={photoPreview}
                          alt="Pré-visualização"
                          className="size-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="label">Mensagem / Detalhes Adicionais</label>
                  <textarea
                    rows={3}
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Conte mais sobre o imóvel: se tem reforma, armários planejados, condomínio, documentação ok, etc."
                    className="field h-auto py-2.5"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary w-full h-12 text-sm font-bold shadow-md gap-2"
                  >
                    <MessageCircle className="size-5" />
                    <span>{submitting ? "Cadastrando..." : "Enviar Solicitação e Abrir WhatsApp"}</span>
                  </button>
                  <p className="text-[11px] text-center text-muted-foreground mt-2">
                    Ao enviar, você será direcionado para o WhatsApp oficial com a notificação pronta.
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}

