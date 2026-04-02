import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { API_BASE_URL } from '../utils/api';
import { publicAnonKey } from '../utils/supabase/info';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { toast } from 'sonner@2.0.3';
import { 
  FileText, 
  RefreshCw, 
  Send, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Eye,
  Download
} from 'lucide-react';

// IDs de los formularios
const KOBO_FORMS = {
  ASISTENCIA_HORAS: 'a7fxQuzKfBijBYKHvgKT5c',
  EJECUCION_EVIDENCIAS: 'aKD5dYnp8VkRpoJ5DJoSi7'
};

interface KoboSubmission {
  _id: number;
  [key: string]: any;
}

interface FormSchema {
  name: string;
  uid: string;
  deployment_status: boolean;
  submission_count: number;
  fields: any[];
  choices: any[];
}

export default function KoboIntegration() {
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [asistencias, setAsistencias] = useState<KoboSubmission[]>([]);
  const [ejecuciones, setEjecuciones] = useState<KoboSubmission[]>([]);
  const [selectedForm, setSelectedForm] = useState<FormSchema | null>(null);
  const [asistenciaForm, setAsistenciaForm] = useState({
    voluntario_nombre: '',
    fecha: new Date().toISOString().split('T')[0],
    horas: '',
    actividad: ''
  });
  const [ejecucionForm, setEjecucionForm] = useState({
    actividad_nombre: '',
    fecha: new Date().toISOString().split('T')[0],
    descripcion: '',
    responsable: ''
  });

  useEffect(() => {
    loadAsistencias();
    loadEjecuciones();
  }, []);

  const makeRequest = async (endpoint: string, options: RequestInit = {}) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'X-Access-Token': accessToken || '',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(errorData.error || `Error ${response.status}`);
    }

    return await response.json();
  };

  const loadAsistencias = async () => {
    try {
      setLoading(true);
      const data = await makeRequest('/kobo/asistencia-horas');
      setAsistencias(data.asistencias || []);
      console.log('✅ Asistencias cargadas:', data.count);
    } catch (error: any) {
      console.error('Error al cargar asistencias:', error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadEjecuciones = async () => {
    try {
      setLoading(true);
      const data = await makeRequest('/kobo/ejecucion-evidencias');
      setEjecuciones(data.ejecuciones || []);
      console.log('✅ Ejecuciones cargadas:', data.count);
    } catch (error: any) {
      console.error('Error al cargar ejecuciones:', error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadFormSchema = async (formId: string) => {
    try {
      setLoading(true);
      const data = await makeRequest(`/kobo/forms/${formId}`);
      setSelectedForm(data.form);
      console.log('✅ Esquema del formulario cargado:', data.form.name);
    } catch (error: any) {
      console.error('Error al cargar esquema:', error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const submitAsistencia = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      console.log('Enviando asistencia a Kobo:', asistenciaForm);
      
      const data = await makeRequest('/kobo/asistencia-horas', {
        method: 'POST',
        body: JSON.stringify(asistenciaForm),
      });
      
      toast.success('✅ Asistencia registrada en KoboToolbox');
      console.log('Submission creado:', data.submission);
      
      // Limpiar formulario
      setAsistenciaForm({
        voluntario_nombre: '',
        fecha: new Date().toISOString().split('T')[0],
        horas: '',
        actividad: ''
      });
      
      // Recargar datos
      loadAsistencias();
    } catch (error: any) {
      console.error('Error al enviar asistencia:', error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const submitEjecucion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      console.log('Enviando ejecución a Kobo:', ejecucionForm);
      
      const data = await makeRequest('/kobo/ejecucion-evidencias', {
        method: 'POST',
        body: JSON.stringify(ejecucionForm),
      });
      
      toast.success('✅ Ejecución registrada en KoboToolbox');
      console.log('Submission creado:', data.submission);
      
      // Limpiar formulario
      setEjecucionForm({
        actividad_nombre: '',
        fecha: new Date().toISOString().split('T')[0],
        descripcion: '',
        responsable: ''
      });
      
      // Recargar datos
      loadEjecuciones();
    } catch (error: any) {
      console.error('Error al enviar ejecución:', error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Integración KoboToolbox</h2>
          <p className="text-gray-600">Gestiona formularios y datos desde KoboToolbox</p>
        </div>
        <Button
          onClick={() => {
            loadAsistencias();
            loadEjecuciones();
          }}
          disabled={loading}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      <Tabs defaultValue="asistencia" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="asistencia">
            <Clock className="h-4 w-4 mr-2" />
            Asistencia y Horas
          </TabsTrigger>
          <TabsTrigger value="ejecucion">
            <CheckCircle className="h-4 w-4 mr-2" />
            Ejecución y Evidencias
          </TabsTrigger>
          <TabsTrigger value="info">
            <Eye className="h-4 w-4 mr-2" />
            Info Formularios
          </TabsTrigger>
        </TabsList>

        {/* ASISTENCIA Y HORAS */}
        <TabsContent value="asistencia" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registrar Asistencia y Horas</CardTitle>
              <CardDescription>
                Envía datos al formulario de Asistencia y Horas en KoboToolbox
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitAsistencia} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="voluntario_nombre">Nombre del Voluntario</Label>
                    <Input
                      id="voluntario_nombre"
                      value={asistenciaForm.voluntario_nombre}
                      onChange={(e) => setAsistenciaForm({ ...asistenciaForm, voluntario_nombre: e.target.value })}
                      placeholder="Ej: Juan Pérez"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fecha">Fecha</Label>
                    <Input
                      id="fecha"
                      type="date"
                      value={asistenciaForm.fecha}
                      onChange={(e) => setAsistenciaForm({ ...asistenciaForm, fecha: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="horas">Horas</Label>
                    <Input
                      id="horas"
                      type="number"
                      step="0.5"
                      value={asistenciaForm.horas}
                      onChange={(e) => setAsistenciaForm({ ...asistenciaForm, horas: e.target.value })}
                      placeholder="Ej: 4"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="actividad">Actividad</Label>
                    <Input
                      id="actividad"
                      value={asistenciaForm.actividad}
                      onChange={(e) => setAsistenciaForm({ ...asistenciaForm, actividad: e.target.value })}
                      placeholder="Ej: Taller de Educación"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  <Send className="h-4 w-4 mr-2" />
                  {loading ? 'Enviando...' : 'Enviar a KoboToolbox'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Datos de Asistencia en KoboToolbox</CardTitle>
              <CardDescription>
                Total de registros: <Badge variant="secondary">{asistencias.length}</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {asistencias.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-30" />
                    <p>No hay registros de asistencia en KoboToolbox</p>
                  </div>
                ) : (
                  asistencias.map((submission, index) => (
                    <div key={submission._id} className="p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">ID: {submission._id}</p>
                          <pre className="text-xs text-gray-600 mt-2 overflow-x-auto">
                            {JSON.stringify(submission, null, 2)}
                          </pre>
                        </div>
                        <Badge variant="outline">#{index + 1}</Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* EJECUCIÓN Y EVIDENCIAS */}
        <TabsContent value="ejecucion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registrar Ejecución y Evidencias</CardTitle>
              <CardDescription>
                Envía datos al formulario de Ejecución y Evidencias en KoboToolbox
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitEjecucion} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="actividad_nombre">Nombre de Actividad</Label>
                    <Input
                      id="actividad_nombre"
                      value={ejecucionForm.actividad_nombre}
                      onChange={(e) => setEjecucionForm({ ...ejecucionForm, actividad_nombre: e.target.value })}
                      placeholder="Ej: Campaña de Reforestación"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fecha_ejecucion">Fecha</Label>
                    <Input
                      id="fecha_ejecucion"
                      type="date"
                      value={ejecucionForm.fecha}
                      onChange={(e) => setEjecucionForm({ ...ejecucionForm, fecha: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="descripcion">Descripción</Label>
                    <Input
                      id="descripcion"
                      value={ejecucionForm.descripcion}
                      onChange={(e) => setEjecucionForm({ ...ejecucionForm, descripcion: e.target.value })}
                      placeholder="Descripción de la actividad"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="responsable">Responsable</Label>
                    <Input
                      id="responsable"
                      value={ejecucionForm.responsable}
                      onChange={(e) => setEjecucionForm({ ...ejecucionForm, responsable: e.target.value })}
                      placeholder="Ej: María García"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  <Send className="h-4 w-4 mr-2" />
                  {loading ? 'Enviando...' : 'Enviar a KoboToolbox'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Datos de Ejecución en KoboToolbox</CardTitle>
              <CardDescription>
                Total de registros: <Badge variant="secondary">{ejecuciones.length}</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {ejecuciones.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-30" />
                    <p>No hay registros de ejecución en KoboToolbox</p>
                  </div>
                ) : (
                  ejecuciones.map((submission, index) => (
                    <div key={submission._id} className="p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium">ID: {submission._id}</p>
                          <pre className="text-xs text-gray-600 mt-2 overflow-x-auto">
                            {JSON.stringify(submission, null, 2)}
                          </pre>
                        </div>
                        <Badge variant="outline">#{index + 1}</Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* INFORMACIÓN DE FORMULARIOS */}
        <TabsContent value="info" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => loadFormSchema(KOBO_FORMS.ASISTENCIA_HORAS)}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-blue-500" />
                  Asistencia y Horas
                </CardTitle>
                <CardDescription>Form ID: {KOBO_FORMS.ASISTENCIA_HORAS}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">Click para ver el esquema del formulario</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => loadFormSchema(KOBO_FORMS.EJECUCION_EVIDENCIAS)}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                  Ejecución y Evidencias
                </CardTitle>
                <CardDescription>Form ID: {KOBO_FORMS.EJECUCION_EVIDENCIAS}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">Click para ver el esquema del formulario</p>
              </CardContent>
            </Card>
          </div>

          {selectedForm && (
            <Card>
              <CardHeader>
                <CardTitle>{selectedForm.name}</CardTitle>
                <CardDescription>
                  Estado: {selectedForm.deployment_status ? (
                    <Badge variant="default" className="bg-green-500">Activo</Badge>
                  ) : (
                    <Badge variant="secondary">Inactivo</Badge>
                  )}
                  {' • '}
                  Submissions: <Badge variant="secondary">{selectedForm.submission_count}</Badge>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Campos del Formulario:</h4>
                    <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-x-auto">
                      {JSON.stringify(selectedForm.fields, null, 2)}
                    </pre>
                  </div>
                  {selectedForm.choices && selectedForm.choices.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Opciones de Selección:</h4>
                      <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-x-auto">
                        {JSON.stringify(selectedForm.choices, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            Información de la Integración
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p>✅ <strong>Conexión establecida</strong> con KoboToolbox API</p>
          <p>📝 <strong>Formularios configurados:</strong></p>
          <ul className="ml-6 list-disc space-y-1">
            <li>Asistencia y Horas (SP): <code className="bg-blue-100 px-1 rounded">{KOBO_FORMS.ASISTENCIA_HORAS}</code></li>
            <li>Ejecución + Evidencias (SP): <code className="bg-blue-100 px-1 rounded">{KOBO_FORMS.EJECUCION_EVIDENCIAS}</code></li>
          </ul>
          <p className="mt-2">🔄 Los datos se sincronizan en tiempo real con KoboToolbox</p>
        </CardContent>
      </Card>
    </div>
  );
}
