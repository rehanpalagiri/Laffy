import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AssessmentProvider } from "@/state/AssessmentContext";
import Index from "./pages/Index";
import HowItWorks from "./pages/HowItWorks";
import Pricing from "./pages/Pricing";
import AgeGate from "./pages/AgeGate";
import Consent from "./pages/Consent";
import Capture from "./pages/Capture";
import Questionnaire from "./pages/Questionnaire";
import Analyzing from "./pages/Analyzing";
import Results from "./pages/Results";
import PrivacyCenter from "./pages/PrivacyCenter";
import AdminQuality from "./pages/AdminQuality";
import Legal from "./pages/Legal";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AssessmentProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/start" element={<AgeGate />} />
            <Route path="/consent" element={<Consent />} />
            <Route path="/capture" element={<Capture />} />
            <Route path="/questionnaire" element={<Questionnaire />} />
            <Route path="/analyzing" element={<Analyzing />} />
            <Route path="/results" element={<Results />} />
            <Route path="/privacy-center" element={<PrivacyCenter />} />
            <Route path="/admin/quality" element={<AdminQuality />} />
            <Route path="/legal/:slug" element={<Legal />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AssessmentProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
