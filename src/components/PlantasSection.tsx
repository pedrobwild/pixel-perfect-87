import { useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Maximize2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

import planta19 from "@/assets/planta-19m2.png";
import planta38 from "@/assets/planta-38m2.png";
import planta40 from "@/assets/planta-40m2.png";
import planta54 from "@/assets/planta-54m2.png";
import planta76 from "@/assets/planta-76m2.jpg";
import planta80 from "@/assets/planta-80m2.png";

interface Planta {
  id: string;
  img: string;
  area: string;
  name: string;
  bedrooms: string;
  bathrooms: string;
  highlights: string[];
  galleryImgs: string[];
}

const plantas: Planta[] = [
  {
    id: "19",
    img: planta19,
    area: "19 m²",
    name: "Studio Compacto",
    bedrooms: "Integrado",
    bathrooms: "1",
    highlights: ["Entrada acessível", "Ideal para Airbnb", "Alta liquidez"],
    galleryImgs: [planta19],
  },
  {
    id: "38",
    img: planta38,
    area: "38 m²",
    name: "Studio Confort",
    bedrooms: "1 suíte",
    bathrooms: "1",
    highlights: ["Living amplo", "Piso chevron", "Cozinha completa"],
    galleryImgs: [planta38],
  },
  {
    id: "40",
    img: planta40,
    area: "40 m²",
    name: "Studio Premium",
    bedrooms: "1 suíte",
    bathrooms: "1",
    highlights: ["Varanda gourmet", "Sala de estar separada", "Acabamento premium"],
    galleryImgs: [planta40],
  },
  {
    id: "54",
    img: planta54,
    area: "54 m²",
    name: "Flat Executive",
    bedrooms: "1 suíte",
    bathrooms: "1 lavabo",
    highlights: ["Mesa de jantar 6 lugares", "Closet", "Pé-direito generoso"],
    galleryImgs: [planta54],
  },
  {
    id: "76",
    img: planta76,
    area: "76 m²",
    name: "Duplex Assinatura",
    bedrooms: "1 suíte + living",
    bathrooms: "2",
    highlights: ["Dois pavimentos", "Layout versátil", "Design autoral"],
    galleryImgs: [planta76],
  },
  {
    id: "80",
    img: planta80,
    area: "83 m²",
    name: "Cobertura Garden",
    bedrooms: "1 suíte",
    bathrooms: "1",
    highlights: ["Área externa privativa", "Jacuzzi", "Espaço gourmet"],
    galleryImgs: [planta80],
  },
];

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
  const [selected, setSelected] = useState<Planta | null>(null);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryIdx, setGalleryIdx] = useState(0);

  const openPlanta = (p: Planta) => {
    setSelected(p);
    setShowGallery(false);
    setGalleryIdx(0);
  };

  const close = () => {
    setSelected(null);
    setShowGallery(false);
  };

  const allImages = plantas.map((p) => p.img);

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
            {plantas.map((p, i) => (
              <FadeIn key={p.id} delay={i * 0.06}>
                <button
                  onClick={() => openPlanta(p)}
                  className="group relative w-full rounded-xl border border-border/60 bg-background overflow-hidden transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none active:scale-[0.97]"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-muted/30">
                    <img
                      src={p.img}
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
                      src={selected.img}
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
                      onClick={() => {
                        setShowGallery(true);
                        setGalleryIdx(0);
                      }}
                    >
                      <Eye className="mr-2 h-4 w-4" />
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

                  <h3 className="font-display text-xl font-bold text-foreground mb-1">Projetos 3D — {selected.name}</h3>
                  <p className="text-sm text-muted-foreground mb-6">{selected.area}</p>

                  <div className="relative rounded-xl overflow-hidden bg-muted/20 border border-border/40">
                    <img
                      src={allImages[galleryIdx % allImages.length]}
                      alt={`Projeto 3D ${galleryIdx + 1}`}
                      className="w-full object-contain max-h-[55vh]"
                    />

                    {allImages.length > 1 && (
                      <>
                        <button
                          onClick={() => setGalleryIdx((prev) => (prev - 1 + allImages.length) % allImages.length)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-xl bg-background/80 backdrop-blur-sm border border-border/60 flex items-center justify-center hover:bg-background transition-colors active:scale-95"
                        >
                          <ChevronLeft className="h-5 w-5 text-foreground" />
                        </button>
                        <button
                          onClick={() => setGalleryIdx((prev) => (prev + 1) % allImages.length)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-xl bg-background/80 backdrop-blur-sm border border-border/60 flex items-center justify-center hover:bg-background transition-colors active:scale-95"
                        >
                          <ChevronRight className="h-5 w-5 text-foreground" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Thumbnails */}
                  <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                    {allImages.map((img, idx) => (
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
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
