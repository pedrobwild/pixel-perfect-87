import { useState } from "react";
import AppNavbar from "@/components/AppNavbar";
import ElephantInsightsSection from "@/components/ElephantInsightsSection";
import EventsCalendar from "@/components/insights/EventsCalendar";
import RevenueSimulator from "@/components/insights/RevenueSimulator";

export default function Insights() {
  const [eventsData, setEventsData] = useState<any>(null);

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <main className="max-w-7xl mx-auto px-4 md:px-6 space-y-16 pb-16">
        <ElephantInsightsSection />
        <EventsCalendar onDataLoaded={setEventsData} />
        <RevenueSimulator eventsData={eventsData} />
      </main>
    </div>
  );
}
