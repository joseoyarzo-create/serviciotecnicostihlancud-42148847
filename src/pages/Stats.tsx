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
  Dot,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  DollarSign,
  Package,
  Wrench,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  FileText,
  X,
  Clock,
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  subMonths,
  addMonths,
  isSameMonth,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { exportStatsToPdf } from '@/lib/statsPdf';
import { FileDown } from 'lucide-react';
import { useRef } from 'react';

const calcTotal = (ficha: FichaTecnica) =>
  ficha.repuestos.reduce(
    (sum, r) => sum + (r.precioEditado ?? r.precio) * r.cantidad,
    0
  );

const formatCLP = (amount: number) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(amount);

const Stats = () => {
  const [fichas, setFichas] = useState<FichaTecnica[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const chartsRef = useRef<HTMLDivElement>(null);
  const today = new Date();

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

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const monthlyFichas = fichas.filter((f) => {
    const date = new Date(f.fechaIngreso);
    return date >= monthStart && date <= monthEnd;
  });

  const totalHistorico = fichas.reduce((sum, f) => sum + calcTotal(f), 0);
  const totalMes = monthlyFichas.reduce((sum, f) => sum + calcTotal(f), 0);
  const enTaller = fichas.filter((f) => f.estado !== 'ENTREGADA').length;
  const promedioPorFicha =
    monthlyFichas.length > 0 ? totalMes / monthlyFichas.length : 0;

  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const dailyData = daysInMonth.map((day) => {
    const dayFichas = monthlyFichas.filter((f) =>
      isSameDay(new Date(f.fechaIngreso), day)
    );
    return {
      fecha: format(day, 'dd'),
      label: format(day, "d 'de' MMMM", { locale: es }),
      fullDate: day,
      total: dayFichas.reduce((sum, f) => sum + calcTotal(f), 0),
      count: dayFichas.length,
    };
  });

  const last12Months = Array.from({ length: 12 })
    .map((_, i) => subMonths(today, 11 - i));
  const monthlyChartData = last12Months.map((month) => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const mFichas = fichas.filter((f) => {
      const date = new Date(f.fechaIngreso);
      return date >= start && date <= end;
    });
    return {
      mes: format(month, 'MMM', { locale: es }).toUpperCase(),
      fullMonth: month,
      total: mFichas.reduce((sum, f) => sum + calcTotal(f), 0),
      count: mFichas.length,
      isCurrentMonth: isSameMonth(month, currentMonth),
    };
  });

  const selectedDayFichas = selectedDay
    ? monthlyFichas.filter((f) => isSameDay(new Date(f.fechaIngreso), selectedDay))
    : [];

  const isCurrentMonthShown = isSameMonth(currentMonth, today);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto py-8 px-4 flex items-center justify-center">
          <p className="text-muted-foreground">Cargando estadísticas...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto py-8 px-4 space-y-8">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-heading font-bold">Panel de Estadísticas</h1>
        </div>

        {/* Month Navigator */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setCurrentMonth(subMonths(currentMonth, 1));
                setSelectedDay(null);
              }}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            <div className="text-center">
              <p className="text-2xl font-bold capitalize">
                {format(currentMonth, 'MMMM yyyy', { locale: es })}
              </p>
              <p className="text-sm text-muted-foreground">
                {monthlyFichas.length} ficha{monthlyFichas.length !== 1 ? 's' : ''} en este mes
              </p>
            </div>

            <div className="flex items-center gap-2">
              {!isCurrentMonthShown && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCurrentMonth(today);
                    setSelectedDay(null);
                  }}
                >
                  Hoy
                </Button>
              )}
              <Button
                variant="outline"
                size="icon"
                disabled={isCurrentMonthShown}
                onClick={() => {
                  setCurrentMonth(addMonths(currentMonth, 1));
                  setSelectedDay(null);
                }}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </Card>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ingresos del Mes
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCLP(totalMes)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {monthlyFichas.length} fichas registradas
              </p>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Promedio por Ficha
              </CardTitle>
              <Wrench className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCLP(promedioPorFicha)}</div>
              <p className="text-xs text-muted-foreground mt-1">Este mes</p>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Equipos en Taller
              </CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{enTaller}</div>
              <p className="text-xs text-muted-foreground mt-1">Pendientes de entrega</p>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Histórico
              </CardTitle>
              <Package className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCLP(totalHistorico)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {fichas.length} fichas en total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Chart — clickable */}
          <Card className="p-6">
            <CardHeader className="px-0 pb-4">
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" />
                Ingresos Diarios — {format(currentMonth, 'MMMM yyyy', { locale: es })}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Haz clic en una barra para ver las fichas de ese día
              </p>
            </CardHeader>
            <CardContent className="px-0 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dailyData}
                  onClick={(payload) => {
                    if (payload && payload.activePayload && payload.activePayload[0]) {
                      const d = payload.activePayload[0].payload;
                      if (selectedDay && isSameDay(selectedDay, d.fullDate)) {
                        setSelectedDay(null);
                      } else {
                        setSelectedDay(d.fullDate);
                      }
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="fecha" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `$${v / 1000}k`}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatCLP(value), 'Ingresos']}
                    labelFormatter={(label) => {
                      const d = dailyData.find((x) => x.fecha === label);
                      return d ? d.label : `Día ${label}`;
                    }}
                  />
                  <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                    {dailyData.map((entry, index) => (
                      <rect
                        key={index}
                        fill={
                          selectedDay && isSameDay(selectedDay, entry.fullDate)
                            ? '#c0521a'
                            : '#F37021'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Monthly Chart — click to navigate */}
          <Card className="p-6">
            <CardHeader className="px-0 pb-4">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Evolución Últimos 12 Meses
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Haz clic en un punto para ir a ese mes
              </p>
            </CardHeader>
            <CardContent className="px-0 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={monthlyChartData}
                  onClick={(payload) => {
                    if (payload && payload.activePayload && payload.activePayload[0]) {
                      const d = payload.activePayload[0].payload;
                      setCurrentMonth(d.fullMonth);
                      setSelectedDay(null);
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `$${v / 1000}k`}
                  />
                  <Tooltip
                    formatter={(value: number, _name, props) => [
                      formatCLP(value),
                      `${props.payload.count} ficha${props.payload.count !== 1 ? 's' : ''}`,
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#F37021"
                    strokeWidth={3}
                    dot={(props) => {
                      const isSelected = props.payload.isCurrentMonth;
                      return (
                        <Dot
                          {...props}
                          r={isSelected ? 8 : 5}
                          fill={isSelected ? '#c0521a' : '#F37021'}
                          stroke="#fff"
                          strokeWidth={2}
                        />
                      );
                    }}
                    activeDot={{ r: 9, fill: '#c0521a' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Selected day fichas */}
        {selectedDay && (
          <Card className="border-primary/40 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-primary" />
                Fichas del {format(selectedDay, "d 'de' MMMM yyyy", { locale: es })}
                <Badge variant="secondary">{selectedDayFichas.length}</Badge>
              </CardTitle>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setSelectedDay(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {selectedDayFichas.length === 0 ? (
                <p className="text-center text-muted-foreground py-6">
                  No hay fichas registradas en este día.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="stihl-table">
                    <thead>
                      <tr>
                        <th>N° BOLETA</th>
                        <th>CLIENTE</th>
                        <th>EQUIPO</th>
                        <th>TÉCNICO</th>
                        <th>TOTAL</th>
                        <th>ESTADO</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedDayFichas.map((ficha) => (
                        <tr key={ficha.id}>
                          <td className="font-mono font-semibold">{ficha.numeroBoleta}</td>
                          <td>{ficha.cliente.nombre}</td>
                          <td>{ficha.modeloMaquina}</td>
                          <td>{ficha.tecnico}</td>
                          <td className="font-semibold text-green-700">
                            {formatCLP(calcTotal(ficha))}
                          </td>
                          <td>
                            <Badge
                              variant={ficha.estado === 'ENTREGADA' ? 'default' : 'secondary'}
                              className={
                                ficha.estado === 'ENTREGADA'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-orange-100 text-orange-800'
                              }
                            >
                              {ficha.estado}
                            </Badge>
                          </td>
                          <td>
                            <Button size="sm" variant="outline" asChild>
                              <Link to={`/ficha-tecnica/${ficha.id}`}>Ver</Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex justify-end mt-3 pt-3 border-t">
                    <p className="text-sm font-semibold">
                      Total del día:{' '}
                      <span className="text-green-700 text-base">
                        {formatCLP(selectedDayFichas.reduce((s, f) => s + calcTotal(f), 0))}
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Monthly fichas list */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Todas las fichas de {format(currentMonth, 'MMMM yyyy', { locale: es })}
              <Badge variant="secondary">{monthlyFichas.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyFichas.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No hay fichas registradas en este mes.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="stihl-table">
                  <thead>
                    <tr>
                      <th>FECHA</th>
                      <th>N° BOLETA</th>
                      <th>CLIENTE</th>
                      <th>EQUIPO</th>
                      <th>TÉCNICO</th>
                      <th>TOTAL</th>
                      <th>ESTADO</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyFichas
                      .slice()
                      .sort(
                        (a, b) =>
                          new Date(b.fechaIngreso).getTime() -
                          new Date(a.fechaIngreso).getTime()
                      )
                      .map((ficha) => (
                        <tr key={ficha.id}>
                          <td className="text-sm text-muted-foreground whitespace-nowrap">
                            {format(new Date(ficha.fechaIngreso), 'dd/MM/yyyy')}
                          </td>
                          <td className="font-mono font-semibold">{ficha.numeroBoleta}</td>
                          <td>{ficha.cliente.nombre}</td>
                          <td>{ficha.modeloMaquina}</td>
                          <td>{ficha.tecnico}</td>
                          <td className="font-semibold text-green-700">
                            {formatCLP(calcTotal(ficha))}
                          </td>
                          <td>
                            <Badge
                              className={
                                ficha.estado === 'ENTREGADA'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-orange-100 text-orange-800'
                              }
                            >
                              {ficha.estado}
                            </Badge>
                          </td>
                          <td>
                            <Button size="sm" variant="outline" asChild>
                              <Link to={`/ficha-tecnica/${ficha.id}`}>Ver</Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                <div className="flex justify-end mt-3 pt-3 border-t">
                  <p className="text-sm font-semibold">
                    Total del mes:{' '}
                    <span className="text-green-700 text-base">{formatCLP(totalMes)}</span>
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Stats;
