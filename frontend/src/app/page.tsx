import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import BenchmarkTelemetry from "@/components/BenchmarkTelemetry";
import ArchitectureFlowchart from "@/components/ArchitectureFlowchart";
import CapabilitiesGrid from "@/components/CapabilitiesGrid";
import CaseLogs from "@/components/CaseLogs";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between">
      {/* Top Margin Line */}
      <div className="w-full h-3 border-b border-[#C9BFB0] bg-[#F3EBDE]" />

      {/* Main Architectural Shell */}
      <div className="relative w-full max-w-[1240px] mx-auto border-x border-[#C9BFB0] bg-[#F3EBDE] flex-1 flex flex-col shadow-sm">
        {/* Outer Frame Corner Crosshair Markers */}
        <div className="crosshair-mark" style={{ top: "-5px", left: "-5px" }} />
        <div className="crosshair-mark" style={{ top: "-5px", right: "-5px" }} />

        {/* Phase 2: Navigation Bar */}
        <Navbar />

        {/* Phase 2: FIG 01 Hero Section */}
        <HeroSection />

        {/* Phase 3: FIG 02 Benchmark Telemetry */}
        <BenchmarkTelemetry />

        {/* Phase 4: FIG 03 LangGraph Orchestration Pipeline */}
        <ArchitectureFlowchart />

        {/* Phase 5: FIG 04 Statutory Intelligence Modules */}
        <CapabilitiesGrid />

        {/* Phase 6: FIG 05 Clinical Case Logs */}
        <CaseLogs />

        {/* Phase 6: Statutory Compliance Colophon & Footer */}
        <Footer />
      </div>

      {/* Bottom Margin Line */}
      <div className="w-full h-6 border-t border-[#C9BFB0] bg-[#F3EBDE]" />
    </div>
  );
}
