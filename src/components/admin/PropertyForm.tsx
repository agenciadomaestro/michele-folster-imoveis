import { useState, useId } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Home,
  DollarSign,
  MapPin,
  Sparkles,
  Image as ImageIcon,
  Check,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Star,
  Upload,
  AlertCircle,
  Loader2,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PROPERTY_TYPES, brl } from "@/lib/realty";

const POPULAR_FEATURES = [
  "Piscina",
  "Churrasqueira",
  "Área gourmet",
  "Ar-condicionado",
  "Mobiliado",
  "Cozinha planejada",
  "Sacada com churrasqueira",
  "Vista para o mar",
  "Condomínio fechado",
  "Elevador",
  "Academia",
  "Portaria 24h",
  "Jardim",
  "Energia solar",
  "Pé-direito duplo",
  "Lareira",
  "Playground",
  "Salão de festas",
  "Aceita pets",
  "Infraestrutura completa",
];

const POPULAR_CITIES = [
  "Florianópolis",
  "São José",
  "Balneário Camboriú",
  "Palhoça",
  "Biguaçu",
  "Itapema",
  "Bombinhas",
  "Joinville",
];

function generateSlug(title: string, code: string): string {
  const base = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  return `${base || "imovel"}-${code.toLowerCase()}`;
}

function generateCode(type: string): string {
  const prefixes: Record<string, string> = {
    Casa: "CA",
    Apartamento: "AP",
    Terreno: "TE",
    Sobrado: "SO",
    Chácara: "CH",
    Sítio: "SI",
    "Sala comercial": "SA",
    Galpão: "GA",
    "Prédio comercial": "PR",
    Outros: "IM",
  };
  const prefix = prefixes[type] || "IM";
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${num}`;
}

type PhotoItem = {
  id: string;
  url: string;
  file?: File;
  previewUrl?: string;
  uploading?: boolean;
};

export function PropertyForm() {
  const navigate = useNavigate();
  const fileInputId = useId();

  // Current step (1 to 5)
  const [step, setStep] = useState(1);

  // Form State
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Casa");
  const [code, setCode] = useState(() => generateCode("Casa"));
  const [purpose, setPurpose] = useState<"venda" | "locacao" | "ambos">("venda");
  const [status, setStatus] = useState<"publicado" | "rascunho">("publicado");
  const [featured, setFeatured] = useState(false);
  const [description, setDescription] = useState("");

  // Step 2: Prices
  const [salePrice, setSalePrice] = useState<number | "">("");
  const [rentPrice, setRentPrice] = useState<number | "">("");
  const [condoFee, setCondoFee] = useState<number | "">("");
  const [iptu, setIptu] = useState<number | "">("");

  // Step 3: Location
  const [state, setState] = useState("SC");
  const [city, setCity] = useState("Florianópolis");
  const [neighborhood, setNeighborhood] = useState("");
  const [address, setAddress] = useState("");
  const [showAddress, setShowAddress] = useState(false);

  // Step 4: Dimensions & Amenities
  const [bedrooms, setBedrooms] = useState<number | "">("");
  const [suites, setSuites] = useState<number | "">("");
  const [bathrooms, setBathrooms] = useState<number | "">("");
  const [parking, setParking] = useState<number | "">("");
  const [areaUseful, setAreaUseful] = useState<number | "">("");
  const [areaBuilt, setAreaBuilt] = useState<number | "">("");
  const [areaLand, setAreaLand] = useState<number | "">("");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [customFeature, setCustomFeature] = useState("");

  // Step 5: Photos
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [externalUrlInput, setExternalUrlInput] = useState("");
  const [uploadProgressText, setUploadProgressText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper when changing property type
  const handleTypeChange = (newType: string) => {
    setType(newType);
    // If code was untouched or matches prefix pattern, refresh prefix
    if (!code || /^[A-Z]{2}\d{4}$/.test(code)) {
      setCode(generateCode(newType));
    }
  };

  const toggleFeature = (feat: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(feat) ? prev.filter((f) => f !== feat) : [...prev, feat]
    );
  };

  const addCustomFeature = () => {
    const trimmed = customFeature.trim();
    if (!trimmed) return;
    if (!selectedFeatures.includes(trimmed)) {
      setSelectedFeatures((prev) => [...prev, trimmed]);
    }
    setCustomFeature("");
  };

  // Photo handlers
  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newItems: PhotoItem[] = Array.from(files).map((f) => ({
      id: Math.random().toString(36).substring(7),
      url: "",
      file: f,
      previewUrl: URL.createObjectURL(f),
    }));
    setPhotos((prev) => [...prev, ...newItems]);
  };

  const handleAddExternalUrl = () => {
    const trimmed = externalUrlInput.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://") && !trimmed.startsWith("/")) {
      toast.error("Informe uma URL válida (ex: https://...)");
      return;
    }
    setPhotos((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(7),
        url: trimmed,
        previewUrl: trimmed,
      },
    ]);
    setExternalUrlInput("");
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => {
      const removed = prev[index];
      if (removed?.previewUrl && removed.file) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const setCoverPhoto = (index: number) => {
    if (index === 0) return;
    setPhotos((prev) => {
      const copy = [...prev];
      const item = copy[index];
      if (!item) return prev;
      copy.splice(index, 1);
      copy.unshift(item);
      return copy;
    });
    toast.success("Foto definida como capa principal!");
  };

  // Step Validation
  const validateStep = (current: number): boolean => {
    if (current === 1) {
      if (!title.trim()) {
        toast.error("Por favor, preencha o título do imóvel.");
        return false;
      }
      if (!code.trim()) {
        toast.error("Por favor, preencha o código do imóvel.");
        return false;
      }
      return true;
    }
    if (current === 2) {
      if (purpose === "venda" && (!salePrice || Number(salePrice) <= 0)) {
        toast.error("Por favor, informe o valor de venda.");
        return false;
      }
      if (purpose === "locacao" && (!rentPrice || Number(rentPrice) <= 0)) {
        toast.error("Por favor, informe o valor da locação.");
        return false;
      }
      if (purpose === "ambos" && !salePrice && !rentPrice) {
        toast.error("Informe pelo menos o valor de venda ou locação.");
        return false;
      }
      return true;
    }
    if (current === 3) {
      if (!city.trim()) {
        toast.error("Por favor, selecione ou digite a cidade.");
        return false;
      }
      if (!neighborhood.trim()) {
        toast.error("Por favor, informe o bairro do imóvel.");
        return false;
      }
      return true;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 5));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Final Submit Handler
  const handleSubmit = async () => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      return;
    }

    setIsSubmitting(true);
    setUploadProgressText("Preparando dados do imóvel...");

    try {
      const { data: authData } = await supabase.auth.getUser();
      const currentUser = authData?.user;

      // 1. Process and upload photos
      const finalPhotoUrls: string[] = [];
      const bucketName = "property-photos";

      for (let i = 0; i < photos.length; i++) {
        const item = photos[i];
        if (!item) continue;
        if (item.url && !item.file) {
          // Already an external or saved URL
          finalPhotoUrls.push(item.url);
          continue;
        }

        if (item.file) {
          setUploadProgressText(`Enviando foto ${i + 1} de ${photos.length}...`);
          const fileExt = item.file.name.split(".").pop() || "jpg";
          const safeCode = code.trim().toUpperCase();
          const filePath = `${safeCode}/${Date.now()}-${i}.${fileExt}`;

          // Try uploading to Supabase Storage
          let uploadedUrl = "";
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(filePath, item.file, {
              cacheControl: "3600",
              upsert: true,
            });

          if (!uploadError && uploadData) {
            const { data: publicData } = supabase.storage
              .from(bucketName)
              .getPublicUrl(filePath);
            uploadedUrl = publicData.publicUrl;
          } else {
            // Try fallback bucket 'properties'
            const { data: fbData, error: fbError } = await supabase.storage
              .from("properties")
              .upload(filePath, item.file, {
                cacheControl: "3600",
                upsert: true,
              });

            if (!fbError && fbData) {
              const { data: fbUrl } = supabase.storage
                .from("properties")
                .getPublicUrl(filePath);
              uploadedUrl = fbUrl.publicUrl;
            } else {
              // If buckets are not initialized in Supabase, create base64 fallback so work is never lost
              uploadedUrl = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(item.file!);
              });
            }
          }

          if (uploadedUrl) {
            finalPhotoUrls.push(uploadedUrl);
          }
        }
      }

      // 2. Insert into `properties` table
      setUploadProgressText("Salvando informações no banco de dados...");
      const finalSlug = generateSlug(title, code);

      const propertyPayload = {
        code: code.trim().toUpperCase(),
        slug: finalSlug,
        title: title.trim(),
        description: description.trim() || null,
        purpose,
        type,
        state: state.trim().toUpperCase(),
        city: city.trim(),
        neighborhood: neighborhood.trim(),
        address: address.trim() || null,
        show_address: showAddress,
        sale_price: salePrice ? Number(salePrice) : null,
        rent_price: rentPrice ? Number(rentPrice) : null,
        condo_fee: condoFee ? Number(condoFee) : null,
        iptu: iptu ? Number(iptu) : null,
        bedrooms: bedrooms !== "" ? Number(bedrooms) : null,
        suites: suites !== "" ? Number(suites) : null,
        bathrooms: bathrooms !== "" ? Number(bathrooms) : null,
        parking: parking !== "" ? Number(parking) : null,
        area_useful: areaUseful !== "" ? Number(areaUseful) : null,
        area_built: areaBuilt !== "" ? Number(areaBuilt) : null,
        area_land: areaLand !== "" ? Number(areaLand) : null,
        features: selectedFeatures,
        status,
        featured,
        created_by: currentUser?.id || null,
        broker_id: currentUser?.id || null,
      };

      const { data: insertedProperty, error: propError } = await supabase
        .from("properties")
        .insert(propertyPayload)
        .select()
        .single();

      if (propError) {
        if (propError.code === "23505" || propError.message?.includes("unique")) {
          throw new Error(`O código de imóvel "${code}" já está cadastrado. Altere o código.`);
        }
        throw propError;
      }

      // 3. Insert photos into `property_photos` table
      if (finalPhotoUrls.length > 0 && insertedProperty) {
        setUploadProgressText("Vinculando fotos ao imóvel...");
        const photoRows = finalPhotoUrls.map((url, index) => ({
          property_id: insertedProperty.id,
          url,
          position: index,
        }));

        const { error: photosError } = await supabase
          .from("property_photos")
          .insert(photoRows);

        if (photosError) {
          console.warn("Aviso ao vincular fotos:", photosError);
        }
      }

      toast.success("Imóvel cadastrado com sucesso!");
      navigate({ to: "/admin" });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao cadastrar imóvel. Verifique os dados.");
    } finally {
      setIsSubmitting(false);
      setUploadProgressText("");
    }
  };

  const stepsList = [
    { num: 1, label: "Básico & Tipo", icon: Home },
    { num: 2, label: "Valores", icon: DollarSign },
    { num: 3, label: "Localização", icon: MapPin },
    { num: 4, label: "Características", icon: Sparkles },
    { num: 5, label: "Fotos & Salvar", icon: ImageIcon },
  ];

  return (
    <div className="mx-auto max-w-4xl py-6">
      {/* Header with back button */}
      <div className="mb-8 flex items-center justify-between">
        <button
          onClick={() => navigate({ to: "/admin" })}
          className="btn btn-ghost text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1.5 size-4" />
          Voltar ao Painel
        </button>
        <span className="chip text-xs">
          Passo {step} de 5
        </span>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Cadastrar Novo Imóvel</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Preencha as informações do imóvel organizadas pelas etapas abaixo.
        </p>
      </div>

      {/* Visual Step Indicator */}
      <div className="mb-10 overflow-x-auto pb-2">
        <div className="flex items-center justify-between min-w-[550px]">
          {stepsList.map((s, idx) => {
            const Icon = s.icon;
            const isDone = step > s.num;
            const isCurrent = step === s.num;
            return (
              <div key={s.num} className="flex flex-1 items-center">
                <button
                  type="button"
                  onClick={() => {
                    if (s.num < step) setStep(s.num);
                  }}
                  disabled={s.num > step}
                  className="flex items-center gap-2.5 text-left focus:outline-none"
                >
                  <div
                    className={`grid size-9 place-items-center rounded-xl font-bold text-xs transition-all ${
                      isDone
                        ? "bg-primary text-primary-foreground"
                        : isCurrent
                        ? "bg-accent text-primary ring-2 ring-primary ring-offset-2 ring-offset-background"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {isDone ? <Check className="size-4 stroke-[3]" /> : <Icon className="size-4" />}
                  </div>
                  <div>
                    <span className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Etapa {s.num}
                    </span>
                    <span
                      className={`block text-xs font-semibold whitespace-nowrap ${
                        isCurrent ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                </button>
                {idx < stepsList.length - 1 && (
                  <div
                    className={`mx-3 h-[2px] flex-1 transition-colors ${
                      step > s.num ? "bg-primary" : "bg-border"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Container */}
      <div className="panel p-6 sm:p-8 shadow-sm">
        {/* STEP 1: Informações Básicas & Tipo */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold">Informações Básicas</h2>
              <p className="text-sm text-muted-foreground">
                Defina o título, categoria e finalidade comercial do imóvel.
              </p>
            </div>

            <div>
              <label className="label">Título do Anúncio *</label>
              <input
                className="field"
                placeholder="Ex: Linda casa térrea com 3 quartos e piscina em Jurerê"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Um bom título destaca o tipo do imóvel, diferenciais e localização.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Tipo de Imóvel *</label>
                <select
                  className="field"
                  value={type}
                  onChange={(e) => handleTypeChange(e.target.value)}
                >
                  {PROPERTY_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="label">Código de Referência *</label>
                  <button
                    type="button"
                    onClick={() => setCode(generateCode(type))}
                    className="text-xs text-primary hover:underline"
                  >
                    Gerar novo
                  </button>
                </div>
                <input
                  className="field uppercase tracking-wider font-semibold"
                  placeholder="Ex: CA0531"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Finalidade Comercial *</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: "venda", label: "Venda", icon: "🏷️" },
                  { value: "locacao", label: "Locação", icon: "🔑" },
                  { value: "ambos", label: "Venda & Locação", icon: "🔄" },
                ].map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPurpose(p.value as any)}
                    className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3.5 text-center transition-all ${
                      purpose === p.value
                        ? "border-primary bg-accent/40 font-semibold text-primary shadow-sm"
                        : "border-border hover:bg-secondary/50 text-foreground"
                    }`}
                  >
                    <span className="text-xl">{p.icon}</span>
                    <span className="text-xs">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Status Inicial</label>
                <select
                  className="field"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                >
                  <option value="publicado">Publicado (visível no site)</option>
                  <option value="rascunho">Rascunho (apenas interno)</option>
                </select>
              </div>

              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-3 rounded-xl border border-border p-3 cursor-pointer hover:bg-secondary/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="size-4 rounded text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="block text-xs font-semibold">Destacar na Página Inicial</span>
                    <span className="block text-[11px] text-muted-foreground">
                      Exibir na vitrine principal de imóveis em destaque
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label className="label">Descrição Completa</label>
              <textarea
                className="field min-h-[110px] py-2.5 resize-y"
                placeholder="Descreva os pontos fortes, acabamentos, luminosidade, proximidades e diferenciais do imóvel..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* STEP 2: Valores & Financeiro */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold">Valores & Financeiro</h2>
              <p className="text-sm text-muted-foreground">
                Informe os preços conforme a finalidade definida ({purpose === "venda" ? "Venda" : purpose === "locacao" ? "Locação" : "Venda e Locação"}).
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {(purpose === "venda" || purpose === "ambos") && (
                <div>
                  <label className="label">Valor de Venda (R$) *</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-sm font-semibold text-muted-foreground">R$</span>
                    <input
                      type="number"
                      step="1000"
                      className="field pl-10 font-medium"
                      placeholder="Ex: 850000"
                      value={salePrice}
                      onChange={(e) => setSalePrice(e.target.value ? Number(e.target.value) : "")}
                      required
                    />
                  </div>
                  {salePrice !== "" && Number(salePrice) > 0 && (
                    <p className="mt-1 text-xs font-semibold text-primary">{brl(Number(salePrice))}</p>
                  )}
                </div>
              )}

              {(purpose === "locacao" || purpose === "ambos") && (
                <div>
                  <label className="label">Valor de Locação (R$/mês) *</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-sm font-semibold text-muted-foreground">R$</span>
                    <input
                      type="number"
                      step="100"
                      className="field pl-10 font-medium"
                      placeholder="Ex: 3500"
                      value={rentPrice}
                      onChange={(e) => setRentPrice(e.target.value ? Number(e.target.value) : "")}
                      required
                    />
                  </div>
                  {rentPrice !== "" && Number(rentPrice) > 0 && (
                    <p className="mt-1 text-xs font-semibold text-primary">{brl(Number(rentPrice))}/mês</p>
                  )}
                </div>
              )}

              <div>
                <label className="label">Taxa de Condomínio (R$/mês)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm font-semibold text-muted-foreground">R$</span>
                  <input
                    type="number"
                    step="50"
                    className="field pl-10"
                    placeholder="Ex: 650 (opcional)"
                    value={condoFee}
                    onChange={(e) => setCondoFee(e.target.value ? Number(e.target.value) : "")}
                  />
                </div>
              </div>

              <div>
                <label className="label">IPTU (R$)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm font-semibold text-muted-foreground">R$</span>
                  <input
                    type="number"
                    step="50"
                    className="field pl-10"
                    placeholder="Ex: 1200 (opcional)"
                    value={iptu}
                    onChange={(e) => setIptu(e.target.value ? Number(e.target.value) : "")}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-accent/40 p-4 border border-accent">
              <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                <DollarSign className="size-4" />
                Resumo dos Valores:
              </div>
              <div className="mt-2 text-xs text-muted-foreground space-y-1">
                {salePrice !== "" && <p>• <strong>Venda:</strong> {brl(Number(salePrice))}</p>}
                {rentPrice !== "" && <p>• <strong>Locação:</strong> {brl(Number(rentPrice))}/mês</p>}
                {condoFee !== "" && <p>• <strong>Condomínio:</strong> {brl(Number(condoFee))}/mês</p>}
                {iptu !== "" && <p>• <strong>IPTU:</strong> {brl(Number(iptu))}</p>}
                {!salePrice && !rentPrice && <p>Nenhum valor preenchido ainda.</p>}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Localização */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold">Localização do Imóvel</h2>
              <p className="text-sm text-muted-foreground">
                Informe o endereço e defina as opções de privacidade de exibição.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="label">Estado *</label>
                <select
                  className="field"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                >
                  <option value="SC">Santa Catarina (SC)</option>
                  <option value="PR">Paraná (PR)</option>
                  <option value="RS">Rio Grande do Sul (RS)</option>
                  <option value="SP">São Paulo (SP)</option>
                  <option value="RJ">Rio de Janeiro (RJ)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="label">Cidade *</label>
                <input
                  className="field"
                  placeholder="Ex: Florianópolis"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  list="cities-list"
                  required
                />
                <datalist id="cities-list">
                  {POPULAR_CITIES.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
            </div>

            <div>
              <label className="label">Bairro *</label>
              <input
                className="field"
                placeholder="Ex: Jurerê Internacional, Centro, Pedra Branca, etc."
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label">Endereço Completo (Rua, Número, Complemento)</label>
              <input
                className="field"
                placeholder="Ex: Av. dos Búzios, 1200, Bloco B"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="rounded-xl border border-border p-4 bg-surface">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showAddress}
                  onChange={(e) => setShowAddress(e.target.checked)}
                  className="mt-0.5 size-4 rounded text-primary focus:ring-primary"
                />
                <div>
                  <span className="block text-sm font-semibold">Exibir endereço exato no site público</span>
                  <span className="block text-xs text-muted-foreground mt-0.5">
                    {showAddress
                      ? "O endereço completo será exibido publicamente na página do imóvel."
                      : "Recomendado: Por privacidade e segurança, apenas o Bairro e Cidade serão mostrados aos visitantes."}
                  </span>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* STEP 4: Dimensões & Características */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold">Dimensões & Cômodos</h2>
              <p className="text-sm text-muted-foreground">
                Informe as medidas e quantidades de dormitórios, banheiros e vagas.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <label className="label">Dormitórios</label>
                <input
                  type="number"
                  min="0"
                  className="field"
                  placeholder="0"
                  value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value ? Number(e.target.value) : "")}
                />
              </div>

              <div>
                <label className="label">Suítes</label>
                <input
                  type="number"
                  min="0"
                  className="field"
                  placeholder="0"
                  value={suites}
                  onChange={(e) => setSuites(e.target.value ? Number(e.target.value) : "")}
                />
              </div>

              <div>
                <label className="label">Banheiros</label>
                <input
                  type="number"
                  min="0"
                  className="field"
                  placeholder="0"
                  value={bathrooms}
                  onChange={(e) => setBathrooms(e.target.value ? Number(e.target.value) : "")}
                />
              </div>

              <div>
                <label className="label">Vagas Garagem</label>
                <input
                  type="number"
                  min="0"
                  className="field"
                  placeholder="0"
                  value={parking}
                  onChange={(e) => setParking(e.target.value ? Number(e.target.value) : "")}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="label">Área Privativa / Útil (m²)</label>
                <input
                  type="number"
                  min="0"
                  className="field"
                  placeholder="Ex: 120"
                  value={areaUseful}
                  onChange={(e) => setAreaUseful(e.target.value ? Number(e.target.value) : "")}
                />
              </div>

              <div>
                <label className="label">Área Construída (m²)</label>
                <input
                  type="number"
                  min="0"
                  className="field"
                  placeholder="Ex: 180"
                  value={areaBuilt}
                  onChange={(e) => setAreaBuilt(e.target.value ? Number(e.target.value) : "")}
                />
              </div>

              <div>
                <label className="label">Área Total / Terreno (m²)</label>
                <input
                  type="number"
                  min="0"
                  className="field"
                  placeholder="Ex: 360"
                  value={areaLand}
                  onChange={(e) => setAreaLand(e.target.value ? Number(e.target.value) : "")}
                />
              </div>
            </div>

            <div className="border-t pt-6">
              <label className="label">Comodidades & Características</label>
              <p className="text-xs text-muted-foreground mb-3">
                Clique para selecionar as comodidades presentes no imóvel:
              </p>

              <div className="flex flex-wrap gap-2">
                {POPULAR_FEATURES.map((feat) => {
                  const isSelected = selectedFeatures.includes(feat);
                  return (
                    <button
                      key={feat}
                      type="button"
                      onClick={() => toggleFeature(feat)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                        isSelected
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-secondary text-foreground hover:bg-secondary/70 border border-border"
                      }`}
                    >
                      {isSelected ? <Check className="size-3" /> : <Plus className="size-3" />}
                      {feat}
                    </button>
                  );
                })}
              </div>

              {/* Add custom feature */}
              <div className="mt-4 flex gap-2">
                <input
                  className="field max-w-sm"
                  placeholder="Outra comodidade personalizada..."
                  value={customFeature}
                  onChange={(e) => setCustomFeature(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomFeature();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={addCustomFeature}
                  className="btn btn-outline"
                >
                  <Plus className="size-4 mr-1" />
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Fotos & Upload via Supabase Storage */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold">Galeria de Fotos do Imóvel</h2>
              <p className="text-sm text-muted-foreground">
                Envie fotos para o Supabase Storage. A primeira foto será utilizada como imagem de capa no site.
              </p>
            </div>

            {/* Dropzone / Upload area */}
            <div
              className="group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border p-8 text-center transition-colors hover:border-primary/50 hover:bg-accent/10"
            >
              <input
                id={fileInputId}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFilesSelected(e.target.files)}
              />
              <div className="grid size-14 place-items-center rounded-full bg-accent text-primary group-hover:scale-105 transition-transform">
                <Upload className="size-6" />
              </div>
              <h3 className="mt-4 text-base font-bold text-foreground">
                Arraste suas fotos aqui ou clique para selecionar
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Formatos aceitos: JPG, PNG, WEBP (suporta envio múltiplo simultâneo)
              </p>
              <label
                htmlFor={fileInputId}
                className="btn btn-primary mt-4 cursor-pointer"
              >
                <Upload className="mr-1.5 size-4" />
                Escolher Fotos do Computador
              </label>
            </div>

            {/* Alternative: Add photo via external URL */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <input
                className="field flex-1"
                placeholder="Ou cole a URL de uma foto (ex: https://...)"
                value={externalUrlInput}
                onChange={(e) => setExternalUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddExternalUrl();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddExternalUrl}
                className="btn btn-outline"
              >
                <Plus className="mr-1.5 size-4" />
                Adicionar por URL
              </button>
            </div>

            {/* Gallery Grid */}
            {photos.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">
                    Fotos Selecionadas ({photos.length})
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    Clique na estrela para definir a foto como capa principal.
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {photos.map((photo, index) => {
                    const isCover = index === 0;
                    return (
                      <div
                        key={photo.id}
                        className={`group relative overflow-hidden rounded-xl border transition-all ${
                          isCover
                            ? "border-primary ring-2 ring-primary ring-offset-2 ring-offset-background"
                            : "border-border hover:border-muted-foreground/40"
                        }`}
                      >
                        <div className="aspect-[4/3] w-full bg-secondary">
                          <img
                            src={photo.previewUrl || photo.url}
                            alt={`Foto ${index + 1}`}
                            className="size-full object-cover"
                          />
                        </div>

                        {/* Top Badges */}
                        <div className="absolute top-2 left-2 flex gap-1">
                          {isCover ? (
                            <span className="flex items-center gap-1 rounded-md bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground shadow">
                              <Star className="size-3 fill-current" /> Capa
                            </span>
                          ) : (
                            <span className="rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
                              #{index + 1}
                            </span>
                          )}
                        </div>

                        {/* Actions overlay */}
                        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 via-black/40 to-transparent p-2 text-white">
                          {!isCover && (
                            <button
                              type="button"
                              onClick={() => setCoverPhoto(index)}
                              className="text-xs font-medium hover:text-primary-foreground hover:underline"
                              title="Tornar esta a foto de capa"
                            >
                              Definir capa
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removePhoto(index)}
                            className="ml-auto rounded p-1 text-white hover:bg-destructive/80 transition-colors"
                            title="Remover foto"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Summary Card */}
            <div className="rounded-xl border border-border bg-surface p-4">
              <h3 className="text-sm font-semibold mb-2">Resumo Final do Imóvel</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-muted-foreground">
                <div>
                  <span className="block font-medium text-foreground">Imóvel:</span>
                  {type} • {title || "Sem título"}
                </div>
                <div>
                  <span className="block font-medium text-foreground">Código:</span>
                  {code}
                </div>
                <div>
                  <span className="block font-medium text-foreground">Preço:</span>
                  {salePrice ? brl(Number(salePrice)) : rentPrice ? `${brl(Number(rentPrice))}/mês` : "Consulte"}
                </div>
                <div>
                  <span className="block font-medium text-foreground">Localização:</span>
                  {neighborhood ? `${neighborhood}, ` : ""}{city}/{state}
                </div>
                <div>
                  <span className="block font-medium text-foreground">Cômodos:</span>
                  {bedrooms || 0} qtos • {bathrooms || 0} banhs • {parking || 0} vagas
                </div>
                <div>
                  <span className="block font-medium text-foreground">Fotos:</span>
                  {photos.length} foto(s) anexada(s)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-8 flex items-center justify-between border-t pt-6">
          {step > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              disabled={isSubmitting}
              className="btn btn-outline"
            >
              <ChevronLeft className="mr-1.5 size-4" />
              Voltar
            </button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <button
              type="button"
              onClick={nextStep}
              className="btn btn-primary"
            >
              Próximo
              <ChevronRight className="ml-1.5 size-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="btn btn-primary min-w-[180px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  {uploadProgressText || "Cadastrando imóvel..."}
                </>
              ) : (
                <>
                  <Check className="mr-2 size-4" />
                  Concluir e Cadastrar
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
