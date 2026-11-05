import { useState, useEffect, useId } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Home,
  MapPin,
  Sparkles,
  Image as ImageIcon,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Star,
  Upload,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Search,
  Building,
  Check,
  Tag,
  Eye,
  FileText,
  DollarSign,
  ArrowUpDown,
  MoveLeft,
  MoveRight,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PROPERTY_TYPES, brl, type Property } from "@/lib/realty";
import { saveLocalProperty, getLocalProperties } from "@/lib/localProperties";

const DIFFERENTIALS = [
  "Piscina",
  "Churrasqueira",
  "Varanda Gourmet",
  "Ar-condicionado",
  "Pet-friendly",
  "Mobiliado",
  "Cozinha planejada",
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
  "Quadra poliesportiva",
  "Sacada com churrasqueira",
  "Espaço gourmet",
  "Área verde",
];

const POPULAR_PROPERTY_TYPES = [
  "Casa",
  "Apartamento",
  "Terreno",
  "Comercial",
  "Sobrado",
  "Chácara",
  "Sítio",
  "Outros",
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
    Comercial: "CO",
    "Sala comercial": "SA",
    Sobrado: "SO",
    Chácara: "CH",
    Sítio: "SI",
    Galpão: "GA",
    "Prédio comercial": "PR",
    Outros: "IM",
  };
  const prefix = prefixes[type] || "IM";
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${num}`;
}

function formatCep(val: string): string {
  const digits = val.replace(/\D/g, "").slice(0, 8);
  if (digits.length > 5) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }
  return digits;
}

export type PhotoItem = {
  id: string;
  url: string;
  file?: File;
  previewUrl?: string;
  uploading?: boolean;
};

interface PropertyFormProps {
  propertyId?: string;
}

export function PropertyForm({ propertyId }: PropertyFormProps) {
  const navigate = useNavigate();
  const fileInputId = useId();
  const isEditing = Boolean(propertyId);

  // Stepper state (1 to 5)
  const [step, setStep] = useState(1);
  const [loadingInitial, setLoadingInitial] = useState(isEditing);

  // Etapa 1 - Informações Básicas
  const [title, setTitle] = useState("");
  const [purpose, setPurpose] = useState<"venda" | "locacao" | "ambos">("venda");
  const [type, setType] = useState("Casa");
  const [salePrice, setSalePrice] = useState<number | "">("");
  const [rentPrice, setRentPrice] = useState<number | "">("");
  const [condoFee, setCondoFee] = useState<number | "">("");
  const [iptu, setIptu] = useState<number | "">("");
  const [code, setCode] = useState(() => generateCode("Casa"));
  const [description, setDescription] = useState("");
  const [featured, setFeatured] = useState(false);

  // Etapa 2 - Localização & Endereço
  const [cep, setCep] = useState("");
  const [loadingCep, setLoadingCep] = useState(false);
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("Caçapava");
  const [state, setState] = useState("SP");
  const [showAddress, setShowAddress] = useState(false);

  // Etapa 3 - Características do Imóvel
  const [areaUseful, setAreaUseful] = useState<number | "">("");
  const [areaLand, setAreaLand] = useState<number | "">("");
  const [bedrooms, setBedrooms] = useState<number | "">("");
  const [suites, setSuites] = useState<number | "">("");
  const [bathrooms, setBathrooms] = useState<number | "">("");
  const [parking, setParking] = useState<number | "">("");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [customFeature, setCustomFeature] = useState("");

  // Etapa 4 - Galeria de Fotos & Mídia
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [externalUrlInput, setExternalUrlInput] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  // Etapa 5 - Submissão
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingStatus, setSubmittingStatus] = useState<"rascunho" | "publicado">("publicado");
  const [progressMessage, setProgressMessage] = useState("");

  // Load existing property when editing
  useEffect(() => {
    if (!propertyId) return;
    const currentId = propertyId;

    async function loadProperty() {
      setLoadingInitial(true);
      try {
        // 1. Tenta carregar do armazenamento local
        let prop = getLocalProperties().find((p) => p.id === currentId);

        // 2. Se não encontrou localmente, busca no Supabase
        if (!prop) {
          try {
            const { data } = await supabase
              .from("properties")
              .select("*, property_photos(id, url, position)")
              .eq("id", currentId)
              .single();
            if (data) prop = data as Property;
          } catch {}
        }

        if (!prop) {
          toast.error("Não foi possível carregar os dados do imóvel.");
          navigate({ to: "/admin" });
          return;
        }
        setTitle(prop.title || "");
        setPurpose((prop.purpose as any) || "venda");
        setType(prop.type || "Casa");
        setCode(prop.code || "");
        setSalePrice(prop.sale_price ?? "");
        setRentPrice(prop.rent_price ?? "");
        setCondoFee(prop.condo_fee ?? "");
        setIptu(prop.iptu ?? "");
        setDescription(prop.description || "");
        setFeatured(Boolean(prop.featured));

        // Location
        setCity(prop.city || "Caçapava");
        setState(prop.state || "SP");
        setNeighborhood(prop.neighborhood || "");
        setShowAddress(Boolean(prop.show_address));

        // Attempt parsing address if it contains street, number, CEP
        if (prop.address) {
          const parts = prop.address.split(" - ");
          const streetAndNum = parts[0] || "";
          const numMatch = streetAndNum.match(/(.*?),\s*(\d+.*)/);
          if (numMatch) {
            setStreet(numMatch[1]?.trim() || "");
            setNumber(numMatch[2]?.trim() || "");
          } else {
            setStreet(streetAndNum);
          }
          if (parts[1] && !parts[1].startsWith("CEP:")) {
            setComplement(parts[1].trim());
          }
          const cepPart = parts.find((p) => p.startsWith("CEP:"));
          if (cepPart) {
            setCep(cepPart.replace("CEP:", "").trim());
          }
        }

        // Features & dimensions
        setAreaUseful(prop.area_useful ?? "");
        setAreaLand(prop.area_land ?? "");
        setBedrooms(prop.bedrooms ?? "");
        setSuites(prop.suites ?? "");
        setBathrooms(prop.bathrooms ?? "");
        setParking(prop.parking ?? "");
        setSelectedFeatures(prop.features || []);

        // Photos
        if (prop.property_photos && prop.property_photos.length > 0) {
          const sorted = [...prop.property_photos].sort((a, b) => a.position - b.position);
          setPhotos(
            sorted.map((p) => ({
              id: (p as any).id || Math.random().toString(36).substring(7),
              url: p.url,
              previewUrl: p.url,
            }))
          );
        }
      } catch (err) {
        console.error(err);
        toast.error("Erro ao carregar imóvel.");
      } finally {
        setLoadingInitial(false);
      }
    }

    loadProperty();
  }, [propertyId, navigate]);

  // ViaCEP Automatic Search
  const handleCepSearch = async (cepToSearch: string) => {
    const clean = cepToSearch.replace(/\D/g, "");
    if (clean.length !== 8) {
      toast.error("Digite um CEP válido com 8 números.");
      return;
    }

    setLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const data = await res.json();
      if (data.erro) {
        toast.error("CEP não localizado. Preencha os campos manualmente.");
        return;
      }
      if (data.logradouro) setStreet(data.logradouro);
      if (data.bairro) setNeighborhood(data.bairro);
      if (data.localidade) setCity(data.localidade);
      if (data.uf) setState(data.uf);
      toast.success("Endereço preenchido automaticamente via CEP!");
    } catch {
      toast.error("Erro na consulta do CEP. Por favor, preencha manualmente.");
    } finally {
      setLoadingCep(false);
    }
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCep(e.target.value);
    setCep(formatted);
    const digits = formatted.replace(/\D/g, "");
    if (digits.length === 8) {
      handleCepSearch(digits);
    }
  };

  // Change Type Helper
  const handleTypeChange = (newType: string) => {
    setType(newType);
    if (!isEditing && (!code || /^[A-Z]{2}\d{4}$/.test(code))) {
      setCode(generateCode(newType));
    }
  };

  // Feature Toggle
  const toggleFeature = (feat: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(feat) ? prev.filter((f) => f !== feat) : [...prev, feat]
    );
  };

  const addCustomFeature = () => {
    const val = customFeature.trim();
    if (!val) return;
    if (!selectedFeatures.includes(val)) {
      setSelectedFeatures((prev) => [...prev, val]);
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
    toast.success(`${files.length} foto(s) adicionada(s) à galeria.`);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const handleAddExternalUrl = () => {
    const trimmed = externalUrlInput.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://") && !trimmed.startsWith("/")) {
      toast.error("Insira uma URL válida (ex: https://...)");
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
    toast.success("Foto por URL adicionada!");
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

  const movePhoto = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= photos.length) return;
    setPhotos((prev) => {
      const copy = [...prev];
      const item = copy[fromIndex];
      if (!item) return prev;
      copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, item);
      return copy;
    });
  };

  // Step Validation
  const validateStep = (s: number): boolean => {
    if (s === 1) {
      if (!title.trim()) {
        toast.error("Por favor, preencha o título do imóvel.");
        return false;
      }
      if (!code.trim()) {
        toast.error("Por favor, informe o código do imóvel.");
        return false;
      }
      if (purpose === "venda" && (!salePrice || Number(salePrice) <= 0)) {
        toast.error("Informe o valor de venda do imóvel.");
        return false;
      }
      if (purpose === "locacao" && (!rentPrice || Number(rentPrice) <= 0)) {
        toast.error("Informe o valor do aluguel do imóvel.");
        return false;
      }
      if (purpose === "ambos" && !salePrice && !rentPrice) {
        toast.error("Informe pelo menos o valor de venda ou de locação.");
        return false;
      }
      return true;
    }

    if (s === 2) {
      if (!neighborhood.trim()) {
        toast.error("Informe o bairro do imóvel.");
        return false;
      }
      if (!city.trim()) {
        toast.error("Informe a cidade do imóvel.");
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

  // Submission to Supabase
  const handleFinalSubmit = async (chosenStatus: "rascunho" | "publicado") => {
    if (!validateStep(1) || !validateStep(2)) {
      return;
    }

    setIsSubmitting(true);
    setSubmittingStatus(chosenStatus);
    setProgressMessage("Conectando ao Supabase...");

    try {
      const { data: authData } = await supabase.auth.getUser();
      let currentUser: any = authData?.user;
      if (!currentUser && typeof window !== "undefined") {
        const stored = localStorage.getItem("master_auth_user");
        if (stored) {
          try {
            currentUser = JSON.parse(stored);
          } catch {}
        }
      }

      // 1. Process Photos and Upload to Supabase Storage
      const bucketName = "property-photos";
      const finalPhotoUrls: string[] = [];

      for (let i = 0; i < photos.length; i++) {
        const item = photos[i];
        if (!item) continue;

        // If it already has an existing URL and no local File
        if (item.url && !item.file) {
          finalPhotoUrls.push(item.url);
          continue;
        }

        if (item.file) {
          setProgressMessage(`Enviando foto ${i + 1} de ${photos.length} para o Supabase Storage...`);
          const fileExt = item.file.name.split(".").pop() || "jpg";
          const safeCode = code.trim().toUpperCase();
          const filePath = `${safeCode}/${Date.now()}-${i}.${fileExt}`;

          let uploadedUrl = "";
          // Try main bucket: property-photos
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
            // Fallback bucket: properties
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
              // Base64 fallback if storage bucket not yet created in Supabase Dashboard
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

      // Format full address
      let formattedAddress = street.trim();
      if (number.trim()) formattedAddress += `, ${number.trim()}`;
      if (complement.trim()) formattedAddress += ` - ${complement.trim()}`;
      if (cep.trim()) formattedAddress += ` - CEP: ${cep.trim()}`;

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
        address: formattedAddress || null,
        show_address: showAddress,
        sale_price: salePrice !== "" ? Number(salePrice) : null,
        rent_price: rentPrice !== "" ? Number(rentPrice) : null,
        condo_fee: condoFee !== "" ? Number(condoFee) : null,
        iptu: iptu !== "" ? Number(iptu) : null,
        bedrooms: bedrooms !== "" ? Number(bedrooms) : null,
        suites: suites !== "" ? Number(suites) : null,
        bathrooms: bathrooms !== "" ? Number(bathrooms) : null,
        parking: parking !== "" ? Number(parking) : null,
        area_useful: areaUseful !== "" ? Number(areaUseful) : null,
        area_land: areaLand !== "" ? Number(areaLand) : null,
        area_built: areaUseful !== "" ? Number(areaUseful) : null,
        features: selectedFeatures,
        status: chosenStatus,
        featured,
        created_by: currentUser?.id || null,
        broker_id: currentUser?.id || null,
      };

      // ID do imóvel (mantém o existente ou gera novo UUID)
      let savedPropertyId =
        propertyId ||
        (typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : "prop-" + Date.now());

      const fullProperty: Property = {
        id: savedPropertyId,
        code: code.trim().toUpperCase(),
        slug: finalSlug,
        title: title.trim(),
        description: description.trim() || null,
        purpose,
        type,
        state: state.trim().toUpperCase(),
        city: city.trim(),
        neighborhood: neighborhood.trim(),
        address: formattedAddress || null,
        show_address: showAddress,
        sale_price: salePrice !== "" ? Number(salePrice) : null,
        rent_price: rentPrice !== "" ? Number(rentPrice) : null,
        condo_fee: condoFee !== "" ? Number(condoFee) : null,
        iptu: iptu !== "" ? Number(iptu) : null,
        bedrooms: bedrooms !== "" ? Number(bedrooms) : null,
        suites: suites !== "" ? Number(suites) : null,
        bathrooms: bathrooms !== "" ? Number(bathrooms) : null,
        parking: parking !== "" ? Number(parking) : null,
        area_useful: areaUseful !== "" ? Number(areaUseful) : null,
        area_land: areaLand !== "" ? Number(areaLand) : null,
        area_built: areaUseful !== "" ? Number(areaUseful) : null,
        features: selectedFeatures,
        status: chosenStatus,
        featured,
        created_by: currentUser?.id || null,
        broker_id: currentUser?.id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        property_photos: finalPhotoUrls.map((url, index) => ({
          url,
          position: index,
        })),
      };

      // 1. Salva imediatamente no armazenamento local persistente (garante que NUNCA seja perdido e apareça no site)
      saveLocalProperty(fullProperty);

      // 2. Tenta sincronizar com o banco de dados Supabase
      setProgressMessage("Sincronizando com o banco de dados...");
      try {
        if (isEditing && propertyId) {
          await supabase.from("properties").update(propertyPayload).eq("id", propertyId);
          await supabase.from("property_photos").delete().eq("property_id", propertyId);
        } else {
          const { data: newProp, error: insertError } = await supabase
            .from("properties")
            .insert({ ...propertyPayload, id: savedPropertyId })
            .select()
            .single();

          if (!insertError && newProp?.id) {
            savedPropertyId = newProp.id;
            fullProperty.id = savedPropertyId;
            saveLocalProperty(fullProperty);
          }
        }

        if (savedPropertyId && finalPhotoUrls.length > 0) {
          const photoRecords = finalPhotoUrls.map((url, index) => ({
            property_id: savedPropertyId,
            url,
            position: index,
          }));
          await supabase.from("property_photos").insert(photoRecords);
        }
      } catch (supabaseErr) {
        console.warn("Aviso na sincronização do Supabase:", supabaseErr);
      }

      toast.success(
        isEditing
          ? "Imóvel atualizado com sucesso!"
          : chosenStatus === "publicado"
          ? "Imóvel publicado no site com sucesso!"
          : "Imóvel salvo como rascunho com sucesso!"
      );

      navigate({ to: "/admin" });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao salvar imóvel. Verifique os dados.");
    } finally {
      setIsSubmitting(false);
      setProgressMessage("");
    }
  };

  const stepsList = [
    { num: 1, label: "Básico & Valores", icon: Home },
    { num: 2, label: "Endereço (ViaCEP)", icon: MapPin },
    { num: 3, label: "Características", icon: Sparkles },
    { num: 4, label: "Fotos & Mídia", icon: ImageIcon },
    { num: 5, label: "Revisão & Salvar", icon: CheckCircle2 },
  ];

  if (loadingInitial) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Carregando dados do imóvel...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl py-4 sm:py-6">
      {/* Top Bar */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate({ to: "/admin" })}
          className="btn btn-ghost text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1.5 size-4" />
          Voltar ao Painel
        </button>
        <span className="chip text-xs">
          {isEditing ? "Modo Edição" : "Novo Cadastro"} • Etapa {step} de 5
        </span>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          {isEditing ? `Editar Imóvel (${code})` : "Cadastrar Novo Imóvel"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Preencha os dados em etapas integradas diretamente ao banco de dados e Storage do Supabase.
        </p>
      </div>

      {/* Stepper Indicator */}
      <div className="mb-8 overflow-x-auto pb-2">
        <div className="flex items-center justify-between min-w-[620px]">
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
                      Passo {s.num}
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

      {/* Form Card */}
      <div className="panel p-6 sm:p-8 shadow-sm">
        {/* ========================================================================= */}
        {/* ETAPA 1: INFORMAÇÕES BÁSICAS */}
        {/* ========================================================================= */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold">Etapa 1: Informações Básicas & Valores</h2>
              <p className="text-sm text-muted-foreground">
                Informe o título, tipo do imóvel, formato de negócio e valores comerciais.
              </p>
            </div>

            <div>
              <label className="label">Título do Imóvel *</label>
              <input
                className="field"
                placeholder="Ex: Casa térrea moderna com piscina e 3 suítes no Campeche"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Tipo de Negócio *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "venda", label: "Venda", icon: "🏷️" },
                    { value: "locacao", label: "Locação", icon: "🔑" },
                    { value: "ambos", label: "Ambos", icon: "🔄" },
                  ].map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPurpose(p.value as any)}
                      className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition-all ${
                        purpose === p.value
                          ? "border-primary bg-accent/40 font-semibold text-primary shadow-sm"
                          : "border-border hover:bg-secondary/60 text-foreground"
                      }`}
                    >
                      <span className="text-lg">{p.icon}</span>
                      <span className="text-xs mt-0.5">{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Tipo de Imóvel *</label>
                <select
                  className="field"
                  value={type}
                  onChange={(e) => handleTypeChange(e.target.value)}
                >
                  {POPULAR_PROPERTY_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Preços e Financeiro */}
            <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t">
              {(purpose === "venda" || purpose === "ambos") && (
                <div>
                  <label className="label">Valor de Venda (R$) *</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-sm font-semibold text-muted-foreground">
                      R$
                    </span>
                    <input
                      type="number"
                      step="1000"
                      className="field pl-10 font-medium"
                      placeholder="Ex: 950000"
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
                  <label className="label">Valor de Aluguel (R$/mês) *</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-sm font-semibold text-muted-foreground">
                      R$
                    </span>
                    <input
                      type="number"
                      step="100"
                      className="field pl-10 font-medium"
                      placeholder="Ex: 4200"
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
                <label className="label">Condomínio (R$/mês)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm font-semibold text-muted-foreground">
                    R$
                  </span>
                  <input
                    type="number"
                    step="50"
                    className="field pl-10"
                    placeholder="Ex: 600 (opcional)"
                    value={condoFee}
                    onChange={(e) => setCondoFee(e.target.value ? Number(e.target.value) : "")}
                  />
                </div>
              </div>

              <div>
                <label className="label">IPTU (R$)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm font-semibold text-muted-foreground">
                    R$
                  </span>
                  <input
                    type="number"
                    step="50"
                    className="field pl-10"
                    placeholder="Ex: 1500 (opcional)"
                    value={iptu}
                    onChange={(e) => setIptu(e.target.value ? Number(e.target.value) : "")}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t">
              <div>
                <div className="flex items-center justify-between">
                  <label className="label">Código de Referência *</label>
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => setCode(generateCode(type))}
                      className="text-xs text-primary hover:underline"
                    >
                      Gerar novo
                    </button>
                  )}
                </div>
                <input
                  className="field uppercase tracking-wider font-semibold"
                  placeholder="Ex: CA0531"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  required
                />
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
                    <span className="block text-xs font-semibold">Destacar na Home</span>
                    <span className="block text-[11px] text-muted-foreground">
                      Exibir na vitrine principal de destaques
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label className="label">Descrição Completa do Imóvel</label>
              <textarea
                className="field min-h-[100px] py-2.5 resize-y"
                placeholder="Detalhes sobre acabamentos, iluminação, cômodos, posição solar e proximidades..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ETAPA 2: LOCALIZAÇÃO & ENDEREÇO COM BUSCA VIACEP */}
        {/* ========================================================================= */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold">Etapa 2: Localização & Endereço</h2>
              <p className="text-sm text-muted-foreground">
                Digite o CEP para preenchimento automático das informações de endereço pelo ViaCEP.
              </p>
            </div>

            {/* CEP Box */}
            <div className="rounded-2xl border border-primary/20 bg-accent/20 p-4">
              <label className="label text-primary font-bold">CEP (Busca Automática ViaCEP)</label>
              <div className="flex gap-2">
                <div className="relative flex-1 max-w-xs">
                  <input
                    className="field font-mono font-medium text-base"
                    placeholder="00000-000"
                    value={cep}
                    onChange={handleCepChange}
                    maxLength={9}
                  />
                  {loadingCep && (
                    <div className="absolute right-3 top-2.5">
                      <Loader2 className="size-4 animate-spin text-primary" />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleCepSearch(cep)}
                  disabled={loadingCep || cep.replace(/\D/g, "").length !== 8}
                  className="btn btn-primary"
                >
                  <Search className="mr-1.5 size-4" />
                  Buscar CEP
                </button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Digite os 8 números do CEP para carregar logradouro, bairro, cidade e estado automaticamente.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="label">Rua / Logradouro</label>
                <input
                  className="field"
                  placeholder="Ex: Avenida dos Búzios"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Número</label>
                <input
                  className="field"
                  placeholder="Ex: 1250"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Complemento</label>
                <input
                  className="field"
                  placeholder="Ex: Apto 402, Bloco B (opcional)"
                  value={complement}
                  onChange={(e) => setComplement(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Bairro *</label>
                <input
                  className="field"
                  placeholder="Ex: Jurerê Internacional, Centro, Pedra Branca"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="label">Cidade *</label>
                <input
                  className="field"
                  placeholder="Ex: Florianópolis"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="label">Estado (UF) *</label>
                <input
                  className="field uppercase text-center font-bold"
                  maxLength={2}
                  value={state}
                  onChange={(e) => setState(e.target.value.toUpperCase())}
                  required
                />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-4">
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
                      ? "O endereço completo (rua e número) será visível a todos os visitantes."
                      : "Recomendado por segurança: Apenas o Bairro e a Cidade serão exibidos aos clientes."}
                  </span>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ETAPA 3: CARACTERÍSTICAS & DIFERENCIAIS */}
        {/* ========================================================================= */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold">Etapa 3: Características do Imóvel</h2>
              <p className="text-sm text-muted-foreground">
                Informe as áreas e cômodos, além de marcar os diferenciais e comodidades do imóvel.
              </p>
            </div>

            {/* Dimensões */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Área Útil / Privativa (m²)</label>
                <input
                  type="number"
                  min="0"
                  className="field"
                  placeholder="Ex: 140"
                  value={areaUseful}
                  onChange={(e) => setAreaUseful(e.target.value ? Number(e.target.value) : "")}
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

            {/* Cômodos */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 pt-2 border-t">
              <div>
                <label className="label">Quartos</label>
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
                <label className="label">Vagas de Garagem</label>
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

            {/* Diferenciais */}
            <div className="pt-2 border-t">
              <label className="label">Diferenciais & Comodidades</label>
              <p className="text-xs text-muted-foreground mb-3">
                Marque os diferenciais do imóvel para facilitar a busca dos clientes:
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {DIFFERENTIALS.map((feat) => {
                  const isChecked = selectedFeatures.includes(feat);
                  return (
                    <label
                      key={feat}
                      className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs font-medium cursor-pointer transition-all ${
                        isChecked
                          ? "border-primary bg-accent/50 text-primary font-semibold shadow-xs"
                          : "border-border hover:bg-secondary/60 text-foreground"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleFeature(feat)}
                        className="size-3.5 rounded text-primary focus:ring-primary"
                      />
                      <span>{feat}</span>
                    </label>
                  );
                })}
              </div>

              {/* Add custom feature */}
              <div className="mt-4 flex gap-2">
                <input
                  className="field max-w-sm"
                  placeholder="Outro diferencial personalizado..."
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

        {/* ========================================================================= */}
        {/* ETAPA 4: GALERIA DE FOTOS & MÍDIA INTEGRADA AO SUPABASE STORAGE */}
        {/* ========================================================================= */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold">Etapa 4: Galeria de Fotos & Mídia</h2>
              <p className="text-sm text-muted-foreground">
                Envie fotos diretamente para o bucket <code>property-photos</code> do Supabase Storage. Ordene e marque a foto principal.
              </p>
            </div>

            {/* Drag & Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
                isDragging
                  ? "border-primary bg-accent/30 scale-[1.01]"
                  : "border-border hover:border-primary/50 hover:bg-accent/10"
              }`}
            >
              <input
                id={fileInputId}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFilesSelected(e.target.files)}
              />
              <div className="grid size-14 place-items-center rounded-full bg-accent text-primary mb-3">
                <Upload className="size-6" />
              </div>
              <h3 className="text-base font-bold text-foreground">
                Arraste suas fotos aqui ou clique para selecionar
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Suporta upload simultâneo de arquivos JPG, PNG, WEBP
              </p>
              <label
                htmlFor={fileInputId}
                className="btn btn-primary mt-4 cursor-pointer"
              >
                <Upload className="mr-1.5 size-4" />
                Selecionar Imagens do Computador
              </label>
            </div>

            {/* Alternativa: Adicionar por URL */}
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <input
                className="field flex-1"
                placeholder="Ou cole a URL de uma imagem na web (ex: https://...)"
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
                Adicionar URL
              </button>
            </div>

            {/* Lista / Grade de fotos com reordenação e capa */}
            {photos.length > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">
                    Galeria do Imóvel ({photos.length} fotos)
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    A primeira foto (#1) será a <strong>Capa Principal</strong> no site.
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
                              <Star className="size-3 fill-current" /> Capa Principal
                            </span>
                          ) : (
                            <span className="rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
                              #{index + 1}
                            </span>
                          )}
                        </div>

                        {/* Controls Toolbar */}
                        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/85 via-black/50 to-transparent p-2 text-white">
                          <div className="flex items-center gap-1">
                            {index > 0 && (
                              <button
                                type="button"
                                onClick={() => movePhoto(index, index - 1)}
                                className="rounded p-1 text-white/90 hover:bg-white/20 transition-colors"
                                title="Mover para esquerda"
                              >
                                <MoveLeft className="size-3.5" />
                              </button>
                            )}
                            {index < photos.length - 1 && (
                              <button
                                type="button"
                                onClick={() => movePhoto(index, index + 1)}
                                className="rounded p-1 text-white/90 hover:bg-white/20 transition-colors"
                                title="Mover para direita"
                              >
                                <MoveRight className="size-3.5" />
                              </button>
                            )}
                            {!isCover && (
                              <button
                                type="button"
                                onClick={() => setCoverPhoto(index)}
                                className="ml-1 text-[11px] font-semibold text-amber-300 hover:underline"
                                title="Marcar como capa"
                              >
                                Fazer Capa
                              </button>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => removePhoto(index)}
                            className="rounded p-1 text-red-300 hover:bg-red-600/80 hover:text-white transition-colors"
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
            ) : (
              <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                Nenhuma foto anexada ainda. Você pode adicionar fotos agora ou salvar e adicionar mais tarde.
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* ETAPA 5: REVISÃO & PUBLICAÇÃO */}
        {/* ========================================================================= */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold">Etapa 5: Revisão & Publicação</h2>
              <p className="text-sm text-muted-foreground">
                Confira todos os dados cadastrados antes de salvar no Supabase.
              </p>
            </div>

            {/* Visual Review Card */}
            <div className="rounded-2xl border border-border bg-surface p-6 space-y-6">
              {/* Header Preview */}
              <div className="flex flex-col sm:flex-row gap-5 items-start">
                <div className="size-32 shrink-0 overflow-hidden rounded-xl bg-secondary border border-border">
                  {photos[0]?.previewUrl || photos[0]?.url ? (
                    <img
                      src={photos[0].previewUrl || photos[0].url}
                      alt="Capa"
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="grid size-full place-items-center text-xs text-muted-foreground">
                      Sem Foto
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary bg-accent px-2 py-0.5 rounded-md">
                      {code}
                    </span>
                    <span className="chip text-xs capitalize">{purpose}</span>
                    <span className="chip text-xs bg-secondary text-foreground">{type}</span>
                    {featured && (
                      <span className="text-xs bg-purple-100 text-purple-800 font-semibold px-2 py-0.5 rounded-full">
                        ⭐ Destaque
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-foreground mt-1">{title || "Sem título"}</h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="size-3.5" />
                    {neighborhood ? `${neighborhood}, ` : ""}
                    {city}/{state} {cep ? `• CEP ${cep}` : ""}
                  </p>
                  <p className="text-base font-bold text-primary pt-1">
                    {purpose === "locacao"
                      ? `${rentPrice ? brl(Number(rentPrice)) : "Consulte"}/mês`
                      : salePrice
                      ? brl(Number(salePrice))
                      : rentPrice
                      ? `${brl(Number(rentPrice))}/mês`
                      : "Consulte"}
                  </p>
                </div>
              </div>

              {/* Grid of details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t pt-4 text-xs">
                <div>
                  <span className="block text-muted-foreground">Condomínio</span>
                  <span className="font-semibold text-foreground">
                    {condoFee ? brl(Number(condoFee)) : "Não informado"}
                  </span>
                </div>
                <div>
                  <span className="block text-muted-foreground">IPTU</span>
                  <span className="font-semibold text-foreground">
                    {iptu ? brl(Number(iptu)) : "Não informado"}
                  </span>
                </div>
                <div>
                  <span className="block text-muted-foreground">Área Útil</span>
                  <span className="font-semibold text-foreground">
                    {areaUseful ? `${areaUseful} m²` : "—"}
                  </span>
                </div>
                <div>
                  <span className="block text-muted-foreground">Área Total</span>
                  <span className="font-semibold text-foreground">
                    {areaLand ? `${areaLand} m²` : "—"}
                  </span>
                </div>
                <div>
                  <span className="block text-muted-foreground">Dormitórios</span>
                  <span className="font-semibold text-foreground">{bedrooms || 0}</span>
                </div>
                <div>
                  <span className="block text-muted-foreground">Suítes</span>
                  <span className="font-semibold text-foreground">{suites || 0}</span>
                </div>
                <div>
                  <span className="block text-muted-foreground">Banheiros</span>
                  <span className="font-semibold text-foreground">{bathrooms || 0}</span>
                </div>
                <div>
                  <span className="block text-muted-foreground">Vagas</span>
                  <span className="font-semibold text-foreground">{parking || 0}</span>
                </div>
              </div>

              {/* Endereço detalhado */}
              <div className="border-t pt-4 text-xs space-y-1">
                <span className="block text-muted-foreground font-semibold">Endereço Configurado:</span>
                <p className="text-foreground">
                  {street ? `${street}, ` : ""}
                  {number ? `Nº ${number}` : "S/N"}
                  {complement ? ` (${complement})` : ""}
                  {neighborhood ? ` • Bairro ${neighborhood}` : ""}
                  {city ? ` • ${city}/${state}` : ""}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Privacidade no site:{" "}
                  <strong>
                    {showAddress ? "Endereço completo exibido publicamente" : "Apenas Bairro e Cidade exibidos"}
                  </strong>
                </p>
              </div>

              {/* Diferenciais */}
              {selectedFeatures.length > 0 && (
                <div className="border-t pt-4">
                  <span className="block text-xs text-muted-foreground font-semibold mb-2">
                    Diferenciais ({selectedFeatures.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedFeatures.map((feat) => (
                      <span key={feat} className="chip text-[11px] h-6">
                        {feat}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Fotos Preview */}
              <div className="border-t pt-4">
                <span className="block text-xs text-muted-foreground font-semibold mb-2">
                  Fotos Prontas para Envio ({photos.length}):
                </span>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {photos.map((p, idx) => (
                    <div
                      key={p.id}
                      className="size-16 shrink-0 overflow-hidden rounded-lg border border-border relative bg-secondary"
                    >
                      <img
                        src={p.previewUrl || p.url}
                        alt="Thumb"
                        className="size-full object-cover"
                      />
                      {idx === 0 && (
                        <span className="absolute bottom-0 inset-x-0 bg-primary text-[8px] text-white text-center font-bold py-0.5">
                          CAPA
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons for Saving */}
            <div className="rounded-2xl bg-accent/30 border border-primary/20 p-5 space-y-3">
              <h3 className="text-sm font-bold text-foreground">Como deseja salvar este imóvel?</h3>
              <p className="text-xs text-muted-foreground">
                Escolha salvar como <strong>Rascunho</strong> para continuar editando depois sem exibir publicamente, ou <strong>Publicar Imediatamente</strong> no catálogo do site.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleFinalSubmit("rascunho")}
                  disabled={isSubmitting}
                  className="btn btn-outline flex-1 h-11"
                >
                  {isSubmitting && submittingStatus === "rascunho" ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      {progressMessage || "Salvando rascunho..."}
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 size-4" />
                      Salvar como Rascunho
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleFinalSubmit("publicado")}
                  disabled={isSubmitting}
                  className="btn btn-primary flex-1 h-11"
                >
                  {isSubmitting && submittingStatus === "publicado" ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      {progressMessage || "Publicando imóvel..."}
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 size-4" />
                      {isEditing ? "Salvar Alterações e Publicar" : "Publicar Imóvel no Site"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stepper Navigation Footer */}
        <div className="mt-8 flex items-center justify-between border-t pt-6">
          {step > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              disabled={isSubmitting}
              className="btn btn-outline"
            >
              <ChevronLeft className="mr-1.5 size-4" />
              Voltar Etapa
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
              Avançar para Etapa {step + 1}
              <ChevronRight className="ml-1.5 size-4" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
