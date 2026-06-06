import { useEffect, useState } from 'react';
import { getConfigSistema, updateConfigParam, ConfigSistema, getModelos, saveModelo, deleteModelo, uploadDespiece, getDespieceUrl, ModeloRow, generateId, getFichas, bulkUpdateFichaEstado } from '@/lib/cloudStorage';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Settings, ShieldAlert, Award, Info, Wrench, Package, MessageCircle, FileText, Upload, Trash2, ExternalLink, RotateCcw, CheckCircle2, Search } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { FichaTecnica } from '@/types';
import { estadoLabel, estadoColor } from '@/types';
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

          <WhatsAppTemplatesCard />
          <BulkEntregadasCard />
          <ModelosDespieceCard />
        </div>

      </main>
    </div>
  );
};

// ============ WhatsApp Templates ============
const TEMPLATE_LABELS: Record<TemplateKey, string> = {
  equipoListo: 'Equipo listo para retirar',
  recordatorio: 'Recordatorio (equipo sin retirar)',
  contacto: 'Contacto rápido',
};

const WhatsAppTemplatesCard = () => {
  const { toast } = useToast();
  const keys: TemplateKey[] = ['equipoListo', 'recordatorio', 'contacto'];
  const [values, setValues] = useState<Record<TemplateKey, string>>({
    equipoListo: getTemplate('equipoListo'),
    recordatorio: getTemplate('recordatorio'),
    contacto: getTemplate('contacto'),
  });

  const handleSave = (k: TemplateKey) => {
    saveTemplate(k, values[k]);
    toast({ title: 'Plantilla guardada', description: TEMPLATE_LABELS[k] });
  };
  const handleReset = (k: TemplateKey) => {
    resetTemplate(k);
    setValues((v) => ({ ...v, [k]: DEFAULT_TEMPLATES[k] }));
    toast({ title: 'Plantilla restaurada', description: TEMPLATE_LABELS[k] });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-green-600" />
          Plantillas de WhatsApp
        </CardTitle>
        <CardDescription>
          Edita los mensajes enviados desde la app. Usa las variables disponibles entre {'{llaves}'}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {keys.map((k) => (
          <div key={k} className="p-4 border rounded-lg space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <Label className="font-semibold text-base">{TEMPLATE_LABELS[k]}</Label>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleReset(k)}>
                  <RotateCcw className="h-4 w-4 mr-1" /> Restaurar
                </Button>
                <Button size="sm" onClick={() => handleSave(k)}>Guardar</Button>
              </div>
            </div>
            <Textarea
              rows={8}
              value={values[k]}
              onChange={(e) => setValues((v) => ({ ...v, [k]: e.target.value }))}
              className="font-mono text-xs"
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {TEMPLATE_VARIABLES[k].map((v) => (
                <span key={v.key} className="text-[10px] bg-muted px-2 py-0.5 rounded font-mono" title={v.desc}>
                  {v.key}
                </span>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

// ============ Modelos & Despieces ============
const ModelosDespieceCard = () => {
  const { toast } = useToast();
  const [modelos, setModelos] = useState<ModeloRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [newModelo, setNewModelo] = useState('');
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try { setModelos(await getModelos()); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!newModelo.trim()) return;
    await saveModelo({ id: generateId(), modelo: newModelo.trim().toUpperCase() });
    setNewModelo('');
    await load();
    toast({ title: 'Modelo agregado' });
  };

  const handleUpload = async (m: ModeloRow, file: File) => {
    setUploadingId(m.id);
    try {
      const url = await uploadDespiece(m.id, file);
      await saveModelo({ id: m.id, modelo: m.modelo, despieceUrl: url });
      await load();
      toast({ title: 'Despiece subido', description: m.modelo });
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'No se pudo subir el despiece', variant: 'destructive' });
    } finally {
      setUploadingId(null);
    }
  };

  const handleRemoveDespiece = async (m: ModeloRow) => {
    await saveModelo({ id: m.id, modelo: m.modelo, despieceUrl: null });
    await load();
    toast({ title: 'Despiece eliminado del modelo' });
  };

  const handleDelete = async (m: ModeloRow) => {
    if (!confirm(`¿Eliminar modelo "${m.modelo}"?`)) return;
    await deleteModelo(m.id);
    await load();
  };

  const filtered = modelos.filter((m) => m.modelo.toLowerCase().includes(search.toLowerCase()));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Modelos y Despieces (PDF)
        </CardTitle>
        <CardDescription>
          Sube el PDF de despiece de cada modelo. Estará disponible al abrir la ficha técnica.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Input
            placeholder="Nuevo modelo (ej: MS 250)"
            value={newModelo}
            onChange={(e) => setNewModelo(e.target.value)}
            className="max-w-xs"
          />
          <Button onClick={handleAdd}>Agregar</Button>
          <Input
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs ml-auto"
          />
        </div>
        <div className="max-h-[400px] overflow-y-auto border rounded">
          <table className="w-full text-sm">
            <thead className="bg-muted sticky top-0">
              <tr>
                <th className="text-left p-2">Modelo</th>
                <th className="text-left p-2">Despiece</th>
                <th className="text-right p-2 w-48">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} className="text-center p-4 text-muted-foreground">Cargando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={3} className="text-center p-4 text-muted-foreground">Sin modelos</td></tr>
              ) : filtered.map((m) => (
                <tr key={m.id} className="border-t">
                  <td className="p-2 font-medium">{m.modelo}</td>
                  <td className="p-2">
                    {m.despieceUrl ? (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const url = await getDespieceUrl(m.despieceUrl!);
                            window.open(url, '_blank', 'noopener,noreferrer');
                          } catch {
                            toast({ title: 'No se pudo abrir el despiece', variant: 'destructive' });
                          }
                        }}
                        className="text-primary inline-flex items-center gap-1 underline"
                      >
                        <ExternalLink className="h-3 w-3" /> Ver PDF
                      </button>
                    ) : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="p-2 text-right">
                    <div className="flex justify-end gap-1">
                      <label className="inline-flex">
                        <input
                          type="file"
                          accept="application/pdf,image/*"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && handleUpload(m, e.target.files[0])}
                        />
                        <Button size="sm" variant="outline" asChild disabled={uploadingId === m.id}>
                          <span className="cursor-pointer">
                            <Upload className="h-4 w-4 mr-1" />
                            {uploadingId === m.id ? '...' : (m.despieceUrl ? 'Reemplazar' : 'Subir')}
                          </span>
                        </Button>
                      </label>
                      {m.despieceUrl && (
                        <Button size="sm" variant="outline" onClick={() => handleRemoveDespiece(m)} title="Quitar despiece">
                          <Trash2 className="h-4 w-4 text-amber-600" />
                        </Button>
                      )}
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(m)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default Admin;
