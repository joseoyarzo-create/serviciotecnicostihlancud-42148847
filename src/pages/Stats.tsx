import { useEffect, useState } from 'react';
import { getFichas } from '@/lib/cloudStorage';
import { FichaTecnica } from '@/types';
import Header from '@/components/Header';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  Wrench, 
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, subMonths, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';

const Stats = () => {
  const [fichas, setFichas] = useState<FichaTecnica[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getFichas();
        setFichas(data);
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Helper to calculate totals for a ficha
  const calculateTotals = (ficha: FichaTecnica) => {
    const totalRepuestos = ficha.repuestos.reduce(
      (sum, r) => sum + (r.precioEditado ?? r.precio) * r.cantidad,
      0
    );
    // Asumimos un costo base por servicio si no hay montos explícitos, 
    // pero según el código actual, parece que solo sumamos repuestos.
    // Si hay montos en servicios en el futuro, se sumarían aquí.
    return {
      repuestos: totalRepuestos,
      servicios: 0, // Por ahora el sistema no parece guardar montos por servicio individual
      total: totalRepuestos
    };
  };

  // Filter fichas for the current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  
  const monthlyFichas = fichas.filter(f => {
    const date = f.fechaEntrega || f.fechaIngreso;
    return date >= monthStart && date <= monthEnd;
  });

  // Calculate stats
  const totalGeneral = fichas.reduce((sum, f) => sum + calculateTotals(f).total, 0);
  const totalRepuestos = fichas.reduce((sum, f) => sum + calculateTotals(f).repuestos, 0);
  
  const monthlyTotal = monthlyFichas.reduce((sum, f) => sum + calculateTotals(f).total, 0);
  
  // Daily data for the current month
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const dailyData = daysInMonth.map(day => {
    const dayFichas = monthlyFichas.filter(f => isSameDay(f.fechaEntrega || f.fechaIngreso, day));
    return {
      fecha: format(day, 'dd'),
      total: dayFichas.reduce((sum, f) => sum + calculateTotals(f).total, 0)
    };
  });

  // Monthly data for the last 6 months
  const last6Months = Array.from({ length: 6 }).map((_, i) => subMonths(new Date(), i)).reverse();
  const monthlyChartData = last6Months.map(month => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const monthFichas = fichas.filter(f => {
      const date = f.fechaEntrega || f.fechaIngreso;
      return date >= start && date <= end;
    });
    return {
      mes: format(month, 'MMM', { locale: es }).toUpperCase(),
      total: monthFichas.reduce((sum, f) => sum + calculateTotals(f).total, 0)
    };
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto py-8 px-4 flex items-center justify-center">
          <p>Cargando estadísticas...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto py-8 px-4">
        <div className="flex items-center gap-3 mb-8">
          <TrendingUp className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-heading font-bold">Panel de Estadísticas</h1>
        </div>

        {/* Resumen General */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ingresos Totales (Histórico)</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalGeneral)}</div>
              <p className="text-xs text-muted-foreground mt-1">Suma de todos los servicios realizados</p>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total en Repuestos</CardTitle>
              <Package className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalRepuestos)}</div>
              <p className="text-xs text-muted-foreground mt-1">Inversión acumulada en piezas</p>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Mes Actual ({format(currentMonth, 'MMMM', { locale: es })})</CardTitle>
              <CalendarIcon className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(monthlyTotal)}</div>
              <div className="flex items-center gap-2 mt-4">
                <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => setCurrentMonth(new Date())}>
                  <span className="text-[10px]">Hoy</span>
                </Button>
                <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => setCurrentMonth(subMonths(currentMonth, -1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Ganancias Diarias del Mes */}
          <Card className="p-6">
            <CardHeader className="px-0">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Ganancias Diarias - {format(currentMonth, 'MMMM yyyy', { locale: es })}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="fecha" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `$${value/1000}k`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Ganancia']}
                    labelFormatter={(label) => `Día ${label}`}
                  />
                  <Bar dataKey="total" fill="#F37021" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Ganancias Mensuales (Últimos 6 meses) */}
          <Card className="p-6">
            <CardHeader className="px-0">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Evolución Mensual (Últimos 6 Meses)
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `$${value/1000}k`}
                  />
                  <Tooltip formatter={(value: number) => [formatCurrency(value), 'Ingresos']} />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#F37021" 
                    strokeWidth={3} 
                    dot={{ r: 6, fill: "#F37021", strokeWidth: 2, stroke: "#fff" }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Stats;
