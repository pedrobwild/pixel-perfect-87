import { Building2, BookOpen, Wrench, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function AppNavbar() {
  const { pathname } = useLocation();
  const isHome = pathname === "/";

  return (
    <header className="sticky top-0 z-40 glass-nav border-b border-border/40">
      <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between h-16">
        <div className="flex items-center gap-3">
          {!isHome && (
            <Link to="/">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
          )}
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
            <Building2 className="h-5 w-5 text-primary" />
            <span>Bwild</span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/guia-short-stay">
            <Button variant={pathname === "/guia-short-stay" ? "secondary" : "ghost"} size="sm" className="hidden sm:inline-flex">
              <BookOpen className="mr-1.5 h-3.5 w-3.5" />
              Guia Short Stay
            </Button>
          </Link>
          <Link to="/ferramentas">
            <Button variant={pathname === "/ferramentas" ? "secondary" : "ghost"} size="sm" className="hidden sm:inline-flex">
              <Wrench className="mr-1.5 h-3.5 w-3.5" />
              Ferramentas
            </Button>
          </Link>
          <Link to="/urban-flex-bela-cintra">
            <Button variant="outline" size="sm">Urban Flex</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
