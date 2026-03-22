import AppNavbar from "@/components/AppNavbar";
import ElephantInsightsSection from "@/components/ElephantInsightsSection";

export default function Insights() {
  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <main className="max-w-7xl mx-auto px-4 md:px-6">
        <ElephantInsightsSection />
      </main>
    </div>
  );
}
