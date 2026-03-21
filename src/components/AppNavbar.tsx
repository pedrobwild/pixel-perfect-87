import { Building2 } from "lucide-react";

export default function AppNavbar() {
  return (
    <header className="sticky top-0 z-40 glass-nav border-b border-border/40">
      <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between h-16">
        <a href="/" className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
          <Building2 className="h-5 w-5 text-primary" />
          <span>Urban Flex</span>
        </a>
      </div>
    </header>
  );
}
