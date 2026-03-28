import { useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Maximize2, Eye, Loader2, Sparkles, Ruler, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { tipologias, getPlantaUrl, getProjetosFolder, getStorageBase } from "@/data/tipologias";
import type { Tipologia, TipologiaVariant } from "@/data/tipologias";

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
      animate={inView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function PlantaCard({ tipologia, index, onOpen }: { tipologia: Tipologia; index: number; onOpen: (t: Tipologia) => void }) {
  const hasVariants = tipologia.variants && tipologia.variants.length > 0;
  return (
    <FadeIn delay={index * 0.07}>
      <button
        onClick={() => onOpen(tipologia)}
        className="group relative w-full rounded-2xl border border-border/60 bg-card overflow-hidden transition-all duration-300 hover:border-accent/50 hover:shadow-xl hover:shadow-accent/10 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none active:scale-[0.97]"
      >
        {/* Top accent line */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-accent/80 via-accent to-accent/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="aspect-[4/3] overflow-hidden bg-muted/20 relative">
          <img
            src={getPlantaUrl(tipologia)}
            alt={`Planta ${tipologia.name} — ${tipologia.area}`}
            className="h-full w-full object-contain p-3 transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
            <span className="text-primary-foreground text-sm font-semibold flex items-center gap-1.5 bg-accent px-4 py-2 rounded-full shadow-lg">
              <Eye className="h-4 w-4" />
              Ver projetos de reforma
            </span>
          </div>
        </div>

        <div className="p-4 text-left border-t border-border/40 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-display text-base font-bold text-foreground leading-tight">{tipologia.name}</p>
              <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1">
                <Ruler className="h-3.5 w-3.5" />
                {tipologia.area}
              </p>
            </div>
            <div className="shrink-0 h-8 w-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center group-hover:bg-accent group-hover:border-accent transition-colors">
              <ArrowRight className="h-4 w-4 text-accent group-hover:text-accent-foreground transition-colors" />
            </div>
          </div>

          {hasVariants && (
            <Badge variant="outline" className="text-[10px] border-accent/30 text-accent bg-accent/5 font-semibold">
              <Sparkles className="h-3 w-3 mr-1" />
              2 linhas de projeto
            </Badge>
          )}
        </div>
      </button>
    </FadeIn>
  );
}

function PlantaModal({
  selected,
  showGallery,
  galleryIdx,
  galleryImages,
  loadingGallery,
  activeVariant,
  onClose,
  onViewProjetos,
  onVariantClick,
  setShowGallery,
  setActiveVariant,
  setGalleryIdx,
}: {
  selected: Tipologia;
  showGallery: boolean;
  galleryIdx: number;
  galleryImages: string[];
  loadingGallery: boolean;
  activeVariant: TipologiaVariant | null;
  onClose: () => void;
  onViewProjetos: (t: Tipologia) => void;
  onVariantClick: (v: TipologiaVariant, t: Tipologia) => void;
  setShowGallery: (v: boolean) => void;
  setActiveVariant: (v: TipologiaVariant | null) => void;
  setGalleryIdx: React.Dispatch<React.SetStateAction<number>>;
}) {
  const getOrcamentoUrl = () => {
    if (activeVariant) return activeVariant.orcamentoUrl;
    return `https://envision-build-guide.lovable.app/o/2aa034962039?tipologia=${encodeURIComponent(selected.name)}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="relative bg-background rounded-2xl border border-border/60 shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 h-9 w-9 rounded-xl bg-muted/80 flex items-center justify-center hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-primary active:scale-95"
        >
          <X className="h-4 w-4 text-foreground" />
        </button>

        {!showGallery ? (
          <div className="p-6 md:p-8">
            <div className="rounded-xl overflow-hidden bg-muted/20 border border-border/40 mb-6">
              <img
                src={getPlantaUrl(selected)}
                alt={`Planta ${selected.name}`}
                className="w-full object-contain max-h-[50vh]"
              />
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-display text-2xl font-bold text-foreground">{selected.name}</h3>
                <p className="text-muted-foreground mt-1">{selected.area} · {selected.bedrooms} · {selected.bathrooms} banheiro(s)</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {selected.highlights.map((h) => (
                  <span key={h} className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium">{h}</span>
                ))}
              </div>

              {/* Variant selector or default button */}
              {selected.variants && selected.variants.length > 0 ? (
                <div className="mt-4 space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">Escolha a linha de projeto:</p>
                  <div className="grid grid-cols-2 gap-3">
                    {selected.variants.map((variant) => (
                      <Button
                        key={variant.variantId}
                        size="lg"
                        variant={variant.variantId.includes("collection") ? "outline" : "default"}
                        className={`min-h-[56px] flex flex-col gap-0.5 ${
                          variant.variantId.includes("collection")
                            ? "border-accent/40 hover:bg-accent/5"
                            : "bg-accent hover:bg-accent/90 text-accent-foreground"
                        }`}
                        disabled={loadingGallery}
                        onClick={() => onVariantClick(variant, selected)}
                      >
                        {loadingGallery ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <span className="text-sm font-bold">{variant.label}</span>
                            <span className="text-xs opacity-70">Ver projetos 3D</span>
                          </>
                        )}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <Button
                  size="lg"
                  className="w-full min-h-[48px] mt-4 bg-accent hover:bg-accent/90 text-accent-foreground"
                  disabled={loadingGallery}
                  onClick={() => onViewProjetos(selected)}
                >
                  {loadingGallery ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Eye className="mr-2 h-4 w-4" />
                  )}
                  Visualizar projetos de reforma
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 md:p-8">
            <button
              onClick={() => { setShowGallery(false); setActiveVariant(null); }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Voltar à planta
            </button>

            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h3 className="font-display text-xl font-bold text-foreground mb-1">
                  {activeVariant ? `${activeVariant.label} — ${selected.name}` : `Projetos 3D — ${selected.name}`}
                </h3>
                <p className="text-sm text-muted-foreground">{selected.area}</p>
              </div>
              <a
                href={getOrcamentoUrl()}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="sm" className="shrink-0 bg-accent hover:bg-accent/90 text-accent-foreground font-bold border-none">
                  Orçamento para Reforma
                </Button>
              </a>
            </div>

            <div className="relative rounded-xl overflow-hidden bg-muted/20 border border-border/40">
              <img
                src={galleryImages[galleryIdx % galleryImages.length]}
                alt={`Projeto 3D ${galleryIdx + 1}`}
                className="w-full object-contain max-h-[55vh]"
              />

              {galleryImages.length > 1 && (
                <>
                  <button
                    onClick={() => setGalleryIdx((prev) => (prev - 1 + galleryImages.length) % galleryImages.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-xl bg-background/80 backdrop-blur-sm border border-border/60 flex items-center justify-center hover:bg-background transition-colors active:scale-95"
                  >
                    <ChevronLeft className="h-5 w-5 text-foreground" />
                  </button>
                  <button
                    onClick={() => setGalleryIdx((prev) => (prev + 1) % galleryImages.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-xl bg-background/80 backdrop-blur-sm border border-border/60 flex items-center justify-center hover:bg-background transition-colors active:scale-95"
                  >
                    <ChevronRight className="h-5 w-5 text-foreground" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {galleryImages.length > 1 && (
              <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setGalleryIdx(idx)}
                    className={`shrink-0 h-16 w-20 rounded-lg overflow-hidden border-2 transition-all active:scale-95 ${
                      idx === galleryIdx ? "border-accent" : "border-border/40 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt="" className="h-full w-full object-contain bg-muted/20" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default function PlantasSection() {
  const [selected, setSelected] = useState<Tipologia | null>(null);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [activeVariant, setActiveVariant] = useState<TipologiaVariant | null>(null);

  const openPlanta = (p: Tipologia) => {
    setSelected(p);
    setShowGallery(false);
    setGalleryIdx(0);
    setGalleryImages([]);
    setActiveVariant(null);
  };

  const close = () => {
    setSelected(null);
    setShowGallery(false);
    setGalleryImages([]);
    setActiveVariant(null);
  };

  const loadGalleryImages = async (folder: string, fallbackUrl: string) => {
    setLoadingGallery(true);
    const { data, error } = await supabase.storage.from("images").list(folder, {
      sortBy: { column: "name", order: "asc" },
    });

    if (error || !data || data.length === 0) {
      setGalleryImages([fallbackUrl]);
    } else {
      const base = getStorageBase();
      const urls = data
        .filter((f) => !f.id?.startsWith("."))
        .map((f) => `${base}/${folder}/${f.name}`);
      setGalleryImages(urls.length > 0 ? urls : [fallbackUrl]);
    }
    setLoadingGallery(false);
    setShowGallery(true);
    setGalleryIdx(0);
  };

  const handleViewProjetos = (tipologia: Tipologia) => {
    const folder = getProjetosFolder(tipologia.id);
    loadGalleryImages(folder, getPlantaUrl(tipologia));
  };

  const handleVariantClick = (variant: TipologiaVariant, tipologia: Tipologia) => {
    setActiveVariant(variant);
    loadGalleryImages(variant.projetosFolder, getPlantaUrl(tipologia));
  };

  return (
    <>
      <section className="border-b border-border/40 relative overflow-hidden">
        {/* Subtle background accent */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent/[0.03] via-transparent to-accent/[0.02] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-20 md:py-28 relative">
          {/* Section header — high impact */}
          <div className="max-w-3xl">
            <FadeIn>
              <Badge className="mb-4 bg-accent/10 text-accent border-accent/20 hover:bg-accent/15 text-xs font-semibold tracking-wide px-3 py-1">
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Catálogo de Reforma · 6 Tipologias
              </Badge>
            </FadeIn>

            <FadeIn delay={0.05}>
              <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground leading-[1.1] tracking-tight">
                Escolha sua planta.{" "}
                <span className="text-accent">Visualize a reforma.</span>{" "}
                Receba o orçamento.
              </h2>
            </FadeIn>

            <FadeIn delay={0.1}>
              <p className="mt-5 text-muted-foreground text-base md:text-lg leading-relaxed max-w-2xl">
                De 19 a 83 m², cada tipologia tem projetos 3D prontos com opções de design para você comparar e decidir. 
                Selecione a planta, explore os renders e solicite seu orçamento em poucos cliques.
              </p>
            </FadeIn>

            {/* Value props row */}
            <FadeIn delay={0.15}>
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  Projetos 3D de alta fidelidade
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  2 linhas de design por tipologia
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  Orçamento direto em 1 clique
                </span>
              </div>
            </FadeIn>
          </div>

          {/* Cards grid */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {tipologias.map((p, i) => (
              <PlantaCard key={p.id} tipologia={p} index={i} onOpen={openPlanta} />
            ))}
          </div>

          {/* Bottom CTA */}
          <FadeIn delay={0.4}>
            <div className="mt-10 flex items-center justify-center">
              <p className="text-sm text-muted-foreground text-center max-w-md">
                Clique em qualquer planta acima para ver os projetos 3D decorados e solicitar o orçamento de reforma.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Modal */}
      <AnimatePresence>
        {selected && (
          <PlantaModal
            selected={selected}
            showGallery={showGallery}
            galleryIdx={galleryIdx}
            galleryImages={galleryImages}
            loadingGallery={loadingGallery}
            activeVariant={activeVariant}
            onClose={close}
            onViewProjetos={handleViewProjetos}
            onVariantClick={handleVariantClick}
            setShowGallery={setShowGallery}
            setActiveVariant={setActiveVariant}
            setGalleryIdx={setGalleryIdx}
          />
        )}
      </AnimatePresence>
    </>
  );
}
