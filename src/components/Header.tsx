import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { FileText, Package, Home, LogOut, TrendingUp, Settings, Download } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { exportAllToExcel } from '@/lib/exportExcel';
import stihlLogo from '@/assets/stihl-logo.jpg';

const Header = () => {
  const location = useLocation();
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportAllToExcel();
      toast({ title: 'Exportación lista', description: 'Se descargó el Excel con todos los datos.' });
    } catch (e) {
      toast({ title: 'Error', description: 'No se pudo exportar.', variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };
    { path: '/ficha-tecnica', label: 'Nueva Ficha', icon: FileText },
    { path: '/repuestos', label: 'Repuestos', icon: Package },
    { path: '/stats', label: 'Estadísticas', icon: TrendingUp },
  ];

  if (user?.email === 'n4chu70@taller.local') {
    navItems.push({ path: '/admin', label: 'Admin', icon: Settings });
  }

  return (
    <header className="stihl-header">
      <div className="container mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-4">
          <img src={stihlLogo} alt="STIHL Logo" className="h-12 object-contain" />
          <div className="hidden sm:block">
            <h1 className="font-heading text-xl font-bold tracking-wide">STIHL ANCUD</h1>
            <p className="text-xs text-secondary-foreground/70">Sistema de Taller</p>
          </div>
        </Link>
        
        <div className="flex items-center gap-4">
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-secondary-foreground/10'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
          
          {user && (
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Salir</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;