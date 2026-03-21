import { Building2, BookOpen, Wrench } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function AppNavbar() {
  return (
    <header className="sticky top-0 z-40 glass-nav border-b border-border/40">
      <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
          <Building2 className="h-5 w-5 text-primary" />
          <span>Bwild</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/guia-short-stay">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
              <BookOpen className="mr-1.5 h-3.5 w-3.5" />
              Guia Short Stay
            </Button>
          </Link>
          <Link to="/ferramentas">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
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
