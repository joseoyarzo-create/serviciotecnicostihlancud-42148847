import { useEffect, useState } from 'react';
import { getConfigSistema, updateConfigParam, ConfigSistema, getModelos, saveModelo, deleteModelo, uploadDespiece, ModeloRow, generateId } from '@/lib/cloudStorage';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Settings, ShieldAlert, Award, Info, Wrench, Package, MessageCircle, FileText, Upload, Trash2, ExternalLink, RotateCcw } from 'lucide-react';
import { TemplateKey, DEFAULT_TEMPLATES, getTemplate, saveTemplate, resetTemplate, TEMPLATE_VARIABLES } from '@/lib/waTemplates';

const Admin = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [config, setConfig] = useState<ConfigSistema | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isAdmin = user?.email === 'n4chu70@taller.local';

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const data = await getConfigSistema();
      setConfig(data);
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePuntos = async (checked: boolean) => {
    try {
      await updateConfigParam('sistema_puntos_activo', { valor: checked });
      setConfig(prev => prev ? { ...prev, sistema_puntos_activo: checked } : null);
      toast({
        title: checked ? 'Sistema activado' : 'Sistema desactivado',
        description: `El sistema de fidelización por puntos ha sido ${checked ? 'activado' : 'desactivado'}.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la configuración.',
        variant: 'destructive',
      });
    }
  };

  const handleSaveParam = async (id: string, value: number) => {
    setSaving(true);
    try {
      await updateConfigParam(id, { valor_numerico: value });
      toast({ title: 'Éxito', description: 'Parámetro actualizado correctamente.' });
      await loadConfig();
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo guardar el cambio.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto py-12 px-4 flex flex-col items-center justify-center text-center">
          <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
          <h1 className="text-3xl font-bold mb-2">Acceso Denegado</h1>
          <p className="text-muted-foreground">Esta sección es solo para administradores autorizados.</p>
        </main>
      </div>
    );
  }

  if (loading || !config) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto py-8 px-4">
          <p>Cargando configuración...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto py-8 px-4">
        <div className="flex items-center gap-3 mb-8">
          <Settings className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-heading font-bold">Configuración Avanzada (Admin)</h1>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-orange-500" />
                Módulo de Fidelización
              </CardTitle>
              <CardDescription>
                Configura los parámetros del sistema de puntos y beneficios para clientes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-secondary/20">
                <div className="space-y-0.5">
                  <Label className="text-base font-semibold">Activar Sistema de Puntos</Label>
                  <p className="text-sm text-muted-foreground">
                    Habilita la acumulación y visualización de puntos en las fichas.
                  </p>
                </div>
                <Switch
                  checked={config.sistema_puntos_activo}
                  onCheckedChange={handleTogglePuntos}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4 p-4 border rounded-lg">
                  <div className="flex items-center gap-2 text-primary font-bold mb-2">
                    <Info className="h-4 w-4" />
                    Reglas de Acumulación
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Puntos por cada $ (CLP)</Label>
                    <div className="flex gap-2">
                      <Input 
                        type="number" 
                        defaultValue={config.puntos_por_cada_clp}
                        onBlur={(e) => handleSaveParam('puntos_por_cada_clp', parseInt(e.target.value))}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">Ej: 5000 significa 1 punto por cada $5.000</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Valor Base Mantención ($)</Label>
                    <div className="flex gap-2">
                      <Input 
                        type="number" 
                        defaultValue={config.valor_base_mantencion}
                        onBlur={(e) => handleSaveParam('valor_base_mantencion', parseInt(e.target.value))}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">Valor fijo que se suma para el cálculo de puntos</p>
                  </div>
                </div>

                <div className="space-y-4 p-4 border rounded-lg">
                  <div className="flex items-center gap-2 text-orange-600 font-bold mb-2">
                    <Award className="h-4 w-4" />
                    Metas de Beneficios
                  </div>

                  <div className="space-y-2">
                    <Label>Meta: Afilado Gratis (Puntos)</Label>
                    <div className="flex gap-2">
                      <Input 
                        type="number" 
                        defaultValue={config.puntos_meta_afilado}
                        onBlur={(e) => handleSaveParam('puntos_meta_afilado', parseInt(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Meta: Nivel Oro (Puntos)</Label>
                    <div className="flex gap-2">
                      <Input 
                        type="number" 
                        defaultValue={config.puntos_meta_oro}
                        onBlur={(e) => handleSaveParam('puntos_meta_oro', parseInt(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Meta: Nivel Plata (Puntos)</Label>
                    <div className="flex gap-2">
                      <Input 
                        type="number" 
                        defaultValue={config.puntos_meta_plata}
                        onBlur={(e) => handleSaveParam('puntos_meta_plata', parseInt(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Meta: Nivel Diamante (Puntos)</Label>
                    <div className="flex gap-2">
                      <Input 
                        type="number" 
                        defaultValue={config.puntos_meta_diamante}
                        onBlur={(e) => handleSaveParam('puntos_meta_diamante', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4 p-4 border rounded-lg">
                  <div className="flex items-center gap-2 text-blue-600 font-bold mb-2">
                    <Wrench className="h-4 w-4" />
                    Beneficios de Servicio
                  </div>

                  <div className="space-y-2">
                    <Label>Meta: Carburación Express (Puntos)</Label>
                    <Input 
                      type="number" 
                      defaultValue={config.puntos_meta_carburacion}
                      onBlur={(e) => handleSaveParam('puntos_meta_carburacion', parseInt(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Meta: Limpieza Ultrasonido (Puntos)</Label>
                    <Input 
                      type="number" 
                      defaultValue={config.puntos_meta_ultrasonido}
                      onBlur={(e) => handleSaveParam('puntos_meta_ultrasonido', parseInt(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Meta: Inspección 10 Puntos (Puntos)</Label>
                    <Input 
                      type="number" 
                      defaultValue={config.puntos_meta_inspeccion}
                      onBlur={(e) => handleSaveParam('puntos_meta_inspeccion', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div className="space-y-4 p-4 border rounded-lg">
                  <div className="flex items-center gap-2 text-green-600 font-bold mb-2">
                    <Package className="h-4 w-4" />
                    Beneficios de Producto
                  </div>

                  <div className="space-y-2">
                    <Label>Meta: Aceite de Cadena (Puntos)</Label>
                    <Input 
                      type="number" 
                      defaultValue={config.puntos_meta_aceite_cadena}
                      onBlur={(e) => handleSaveParam('puntos_meta_aceite_cadena', parseInt(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Meta: Garantía Extendida (Puntos)</Label>
                    <Input 
                      type="number" 
                      defaultValue={config.puntos_meta_garantia_extendida}
                      onBlur={(e) => handleSaveParam('puntos_meta_garantia_extendida', parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Admin;
