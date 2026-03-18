import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';
import { Badge } from '../components/Badge';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { format, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, User, Phone, Mail, Clock, FileText, CheckCircle, Edit3, Lock, Trash2 } from 'lucide-react';
import { useToast } from '../components/toast';
import { ConfirmModal } from '../components/ConfirmModal';
import { canEditClinical, canManage } from '../lib/roles';

const safeFormatDate = (dateString, formatStr, options = {}) => {
  if (!dateString) return '-';
  try {
    const parsed = parseISO(dateString);
    if (!isValid(parsed)) return '-';
    return format(parsed, formatStr, options);
  } catch (e) {
    return '-';
  }
};

export const PatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { patients, appointments, isDemoMode, updatePatient, deletePatient } = useApp();
  const { user } = useAuth();
  
  const [patient, setPatient] = useState(null);
  const [patientApps, setPatientApps] = useState([]);
  
  // State for Licenciada observation form
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [clinicalNotes, setClinicalNotes] = useState('');

  // State for Edit Profile Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: '', phone: '', email: '' });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (patients.length > 0) {
      const p = patients.find(pat => pat.id === id);
      if (p) {
        setPatient(p);
        setClinicalNotes(p.basic_history || '');
      } else {
        navigate('/patients'); // Auto-redirect if not found
      }
    }
  }, [id, patients, navigate]);

  useEffect(() => {
    if (patient) {
      const apps = appointments
        .filter(a => a.patient_id === patient.id)
        .sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
      setPatientApps(apps);
    }
  }, [patient, appointments]);

  const handleSaveNotes = async () => {
    await updatePatient(patient.id, { basic_history: clinicalNotes });
    setIsEditingNotes(false);
  };

  const handleOpenEdit = () => {
    setEditForm({
      full_name: patient.full_name,
      phone: patient.phone || '',
      email: patient.email || ''
    });
    setIsEditModalOpen(true);
  };

  const handleUpdatePatient = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    await updatePatient(patient.id, editForm);
    setIsUpdating(false);
    setIsEditModalOpen(false);
  };

  const handleDeletePatient = async () => {
    setIsDeleting(true);
    const { error } = await deletePatient(patient.id);
    setIsDeleting(false);
    setConfirmDeleteOpen(false);
    if (!error) {
      toast.success(`Paciente ${patient.full_name} eliminado.`);
      navigate('/patients');
    } else {
      toast.error('Hubo un error al eliminar el paciente.');
    }
  };

  if (!patient) return <div className="p-8 text-center"><span className="loader"></span></div>;

  return (
    <div className="patient-detail-container animate-fade-in">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate('/patients')} className="p-2">
          <ArrowLeft size={20} /> Volver
        </Button>
        <h1 className="text-2xl font-bold">Expediente del Paciente</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Client Info */}
        <div className="col-span-1 flex flex-col gap-6">
          <Card>
            <CardContent className="flex flex-col items-center p-6 text-center">
              <div className="w-24 h-24 bg-primary-light rounded-full flex items-center justify-center mb-4">
                <User size={48} className="text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-1">{patient.full_name}</h2>
              <p className="text-sm text-primary font-medium mb-4">Paciente Activo</p>
              
              <Button variant="outline" size="sm" className="mb-4 w-full" onClick={handleOpenEdit}>
                <Edit3 size={14} /> Editar Perfil
              </Button>
              
              <div className="w-full flex justify-between items-center text-sm border-t py-2">
                <span className="text-muted flex items-center gap-2"><Phone size={14} /> Teléfono</span>
                <span className="font-medium">{patient.phone || 'No registrado'}</span>
              </div>
              <div className="w-full flex justify-between items-center text-sm border-t py-2">
                <span className="text-muted flex items-center gap-2"><Mail size={14} /> Email</span>
                <span className="font-medium">{patient.email || 'No registrado'}</span>
              </div>
              <div className="w-full flex justify-between items-center text-sm border-t py-2">
                <span className="text-muted flex items-center gap-2"><Clock size={14} /> Registro</span>
                <span className="font-medium">{safeFormatDate(patient.created_at, 'MMM yyyy')}</span>
              </div>
              
              {canManage(user?.role) && (
                <div className="w-full border-t pt-4 mt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-error border-error hover:bg-error-light" 
                    onClick={() => setConfirmDeleteOpen(true)}
                    disabled={isDeleting}
                  >
                    <Trash2 size={14} /> {isDeleting ? 'Eliminando...' : 'Eliminar Paciente'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <FileText size={18} className="text-primary" /> Motivo de Consulta
              </h3>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-main leading-relaxed">
                {patient.reason || 'Sin motivo específico registrado.'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: History & Observations */}
        <div className="col-span-1 md:col-span-2 flex flex-col gap-6">
          
          {/* Clinical Observations Section (Role-based) */}
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="flex justify-between items-center bg-primary-light bg-opacity-10">
              <h3 className="font-semibold text-lg flex items-center gap-2 text-primary-dark">
                <Edit3 size={18} /> Observaciones Clínicas (Privado)
              </h3>
              {canEditClinical(user?.role) && !isEditingNotes && (
                <Button variant="outline" size="sm" onClick={() => setIsEditingNotes(true)}>
                  Editar
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {canEditClinical(user?.role) ? (
                isEditingNotes ? (
                  <div className="flex flex-col gap-3">
                    <textarea
                      className="w-full border rounded-md p-3 focus:border-primary outline-none min-h-[150px]"
                      value={clinicalNotes}
                      onChange={(e) => setClinicalNotes(e.target.value)}
                      placeholder="Historial, avance terapéutico, notas personales..."
                    ></textarea>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" onClick={() => { setClinicalNotes(patient.basic_history || ''); setIsEditingNotes(false); }}>
                        Cancelar
                      </Button>
                      <Button onClick={handleSaveNotes}>
                        Guardar Observaciones
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-app p-4 rounded-md min-h-[100px] text-sm whitespace-pre-wrap">
                    {clinicalNotes || 'No hay observaciones clínicas registradas.'}
                  </div>
                )
              ) : (
                <div className="bg-app p-4 rounded-md text-sm text-muted text-center flex flex-col items-center justify-center gap-2 min-h-[100px]">
                  <Lock size={24} className="opacity-50" />
                  <p>Área restringida. Solo la Licenciada puede ver y editar esta sección.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Appointment History */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Clock size={18} className="text-primary" /> Historial de Citas
              </h3>
            </CardHeader>
            <CardContent className="p-0">
              {patientApps.length > 0 ? (
                <div className="divide-y">
                  {patientApps.map((app) => (
                    <div key={app.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-card-hover transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="bg-primary-light bg-opacity-20 text-primary w-12 h-12 rounded-full flex flex-col items-center justify-center shrink-0">
                          <span className="font-bold text-sm leading-none">{safeFormatDate(app.start_time, 'd')}</span>
                          <span className="text-xs">{safeFormatDate(app.start_time, 'MMM')}</span>
                        </div>
                        <div>
                          <p className="font-semibold">{safeFormatDate(app.start_time, 'EEEE, HH:mm', { locale: es })}</p>
                          <p className="text-sm text-muted">{app.notes || 'Ninguna nota'}</p>
                        </div>
                      </div>
                      <div>
                        {app.status === 'completed' && <Badge variant="success">Completada</Badge>}
                        {app.status === 'scheduled' && <Badge variant="primary">Programada</Badge>}
                        {app.status === 'cancelled' && <Badge variant="error" className="line-through">Cancelada</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted">
                  <CheckCircle size={32} className="mx-auto mb-2 opacity-50" />
                  <p>Este paciente no tiene historial de citas.</p>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Editar Perfil del Paciente">
        <form onSubmit={handleUpdatePatient} className="flex flex-col gap-4">
          <Input 
            label="Nombre Completo" 
            value={editForm.full_name} 
            onChange={(e) => setEditForm({...editForm, full_name: e.target.value})} 
            icon={User} 
            required 
            fullWidth 
          />
          <Input 
            label="Celular" 
            type="tel"
            value={editForm.phone} 
            onChange={(e) => setEditForm({...editForm, phone: e.target.value})} 
            icon={Phone} 
            fullWidth 
          />
          <Input 
            label="Correo Electrónico" 
            type="email"
            value={editForm.email} 
            onChange={(e) => setEditForm({...editForm, email: e.target.value})} 
            icon={Mail} 
            fullWidth 
          />
          <div className="flex gap-2 justify-end mt-4">
            <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={isUpdating}>Guardar Cambios</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDeletePatient}
        title={`Eliminar a ${patient?.full_name}`}
        message="Esta acción borrará todo su historial y citas de forma permanente. No se puede deshacer."
        confirmLabel="Sí, eliminar"
        danger
        loading={isDeleting}
      />
    </div>
  );
};

