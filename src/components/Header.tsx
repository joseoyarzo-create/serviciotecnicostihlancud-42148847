import { Link, useLocation } from 'react-router-dom';
import { FileText, Package, Home } from 'lucide-react';
import stihlLogo from '@/assets/stihl-logo.jpg';

const Header = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Inicio', icon: Home },
    { path: '/ficha-tecnica', label: 'Nueva Ficha', icon: FileText },
    { path: '/repuestos', label: 'Repuestos', icon: Package },
  ];

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
      </div>
    </header>
  );
};

export default Header;
