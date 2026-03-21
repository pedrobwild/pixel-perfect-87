import { useState, useRef, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Maximize2, Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { tipologias, getPlantaUrl, getProjetosFolder, getStorageBase } from "@/data/tipologias";
import type { Tipologia } from "@/data/tipologias";

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

export default function PlantasSection() {
  const [selected, setSelected] = useState<Tipologia | null>(null);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(false);

  const openPlanta = (p: Tipologia) => {
    setSelected(p);
    setShowGallery(false);
    setGalleryIdx(0);
    setGalleryImages([]);
  };

  const close = () => {
    setSelected(null);
    setShowGallery(false);
    setGalleryImages([]);
  };

  const loadGalleryImages = async (tipologia: Tipologia) => {
    setLoadingGallery(true);
    const folder = getProjetosFolder(tipologia.id);
    const { data, error } = await supabase.storage.from("images").list(folder, {
      sortBy: { column: "name", order: "asc" },
    });

    if (error || !data || data.length === 0) {
      // Fallback to planta image
      setGalleryImages([getPlantaUrl(tipologia)]);
    } else {
      const base = getStorageBase();
      const urls = data
        .filter((f) => !f.id?.startsWith("."))
        .map((f) => `${base}/${folder}/${f.name}`);
      setGalleryImages(urls.length > 0 ? urls : [getPlantaUrl(tipologia)]);
    }
    setLoadingGallery(false);
    setShowGallery(true);
    setGalleryIdx(0);
  };

  return (
    <>
      <section className="border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-20 md:py-28">
          <FadeIn>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/80 mb-3">Tipologias disponíveis</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground max-w-2xl">
              Plantas decoradas de 19 a 83 m².
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed max-w-2xl">
              Cada tipologia foi projetada para maximizar a experiência do hóspede e o retorno do investidor. Clique para explorar os detalhes.
            </p>
          </FadeIn>

          <div className="mt-12 grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {tipologias.map((p, i) => (
              <FadeIn key={p.id} delay={i * 0.06}>
                <button
                  onClick={() => openPlanta(p)}
                  className="group relative w-full rounded-xl border border-border/60 bg-background overflow-hidden transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none active:scale-[0.97]"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-muted/30">
                    <img
                      src={getPlantaUrl(p)}
                      alt={`Planta ${p.name} — ${p.area}`}
                      className="h-full w-full object-contain p-2 transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-4 text-left border-t border-border/40">
                    <p className="font-display text-base font-bold text-foreground">{p.name}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{p.area}</p>
                  </div>
                  <div className="absolute top-3 right-3 h-8 w-8 rounded-lg bg-background/80 backdrop-blur-sm border border-border/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Maximize2 className="h-4 w-4 text-foreground" />
                  </div>
                </button>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 backdrop-blur-sm p-4"
            onClick={close}
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
                onClick={close}
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

                    <Button
                      size="lg"
                      className="w-full min-h-[48px] mt-4"
                      disabled={loadingGallery}
                      onClick={() => loadGalleryImages(selected)}
                    >
                      {loadingGallery ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Eye className="mr-2 h-4 w-4" />
                      )}
                      Visualizar tipologias de projetos
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-6 md:p-8">
                  <button
                    onClick={() => setShowGallery(false)}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 flex items-center gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Voltar à planta
                  </button>

                  <div className="flex items-start justify-between gap-4 mb-6">
                    <div>
                      <h3 className="font-display text-xl font-bold text-foreground mb-1">Projetos 3D — {selected.name}</h3>
                      <p className="text-sm text-muted-foreground">{selected.area}</p>
                    </div>
                    <a
                      href={`https://envision-build-guide.lovable.app/o/2aa034962039?tipologia=${encodeURIComponent(selected.name)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="sm" className="shrink-0 bg-orange-500 hover:bg-orange-600 text-black font-bold border-none">
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
                            idx === galleryIdx ? "border-primary" : "border-border/40 opacity-60 hover:opacity-100"
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
        )}
      </AnimatePresence>
    </>
  );
}
