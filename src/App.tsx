import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import FichaTecnica from "./pages/FichaTecnica";
import Repuestos from "./pages/Repuestos";
import Clientes from "./pages/Clientes";
import Stats from "./pages/Stats";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import OAuthConsent from "./pages/OAuthConsent";
import NotFound from "./pages/NotFound";
import FichaPublica from "./pages/FichaPublica";
import Recepciones from "./pages/Recepciones";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
            <Route path="/f/:token" element={<FichaPublica />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/ficha-tecnica" element={<ProtectedRoute><FichaTecnica /></ProtectedRoute>} />
            <Route path="/recepciones" element={<ProtectedRoute><Recepciones /></ProtectedRoute>} />
            <Route path="/ingresar-maquina-reparada" element={<ProtectedRoute><FichaTecnica /></ProtectedRoute>} />
            <Route path="/ficha-tecnica/:id" element={<ProtectedRoute><FichaTecnica /></ProtectedRoute>} />
            <Route path="/repuestos" element={<ProtectedRoute><Repuestos /></ProtectedRoute>} />
            <Route path="/clientes" element={<ProtectedRoute><Clientes /></ProtectedRoute>} />
            <Route path="/stats" element={<ProtectedRoute><Stats /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;