import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { demoAppointments, demoPatients, demoNotifications } from '../lib/demoData';

const AppContext = createContext({});

export const AppProvider = ({ children }) => {
  const { user, isDemoMode } = useAuth();
  
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [schedule, setSchedule] = useState({
    start_hour: 9,
    end_hour: 18,
    slot_minutes: 45,
    blocked_ranges: []
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    } else {
      setAppointments([]);
      setPatients([]);
      setNotifications([]);
      setSchedule({
        start_hour: 9,
        end_hour: 18,
        slot_minutes: 45,
        blocked_ranges: []
      });
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    
    if (isDemoMode) {
      const safeParse = (key, fallback) => {
        try {
          const raw = localStorage.getItem(key);
          return raw ? JSON.parse(raw) : fallback;
        } catch (e) {
          console.warn(`Demo data corrupt in ${key}, resetting.`, e);
          localStorage.removeItem(key);
          return fallback;
        }
      };

      // Mock data load
      const localApps = safeParse('psico_apps', demoAppointments);
      const localPats = safeParse('psico_pats', demoPatients);
      const localNots = safeParse('psico_nots', demoNotifications);
      const localSchedule = safeParse('psico_schedule', schedule);
      
      setAppointments(localApps);
      setPatients(localPats);
      setNotifications(localNots);
      setSchedule(localSchedule);
      
      if (!localStorage.getItem('psico_apps')) {
        localStorage.setItem('psico_apps', JSON.stringify(demoAppointments));
        localStorage.setItem('psico_pats', JSON.stringify(demoPatients));
        localStorage.setItem('psico_nots', JSON.stringify(demoNotifications));
        localStorage.setItem('psico_schedule', JSON.stringify(schedule));
      }
      
      setLoading(false);
      return;
    }

    try {
      // Real DB Fetching
      const [appRes, patRes, notRes, schedRes] = await Promise.all([
        supabase.from('appointments').select('*, patient:patients(*)').order('start_time', { ascending: true }),
        supabase.from('patients').select('*').order('full_name', { ascending: true }),
        supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('app_config').select('*').eq('id', 1).single()
      ]);

      if (!appRes.error) setAppointments(appRes.data);
      if (!patRes.error) setPatients(patRes.data);
      if (!notRes.error) setNotifications(notRes.data);
      if (!schedRes.error && schedRes.data) {
        setSchedule({
          start_hour: schedRes.data.start_hour ?? 9,
          end_hour: schedRes.data.end_hour ?? 18,
          slot_minutes: schedRes.data.slot_minutes ?? 45,
          blocked_ranges: schedRes.data.blocked_ranges || []
        });
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Setup Realtime Subscription
  useEffect(() => {
    if (!user || isDemoMode) return;

    const channel = supabase
      .channel('public-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        () => { setTimeout(() => fetchData(), 800); }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'app_config' },
        (payload) => {
          if (payload.new) {
            setSchedule({
              start_hour: payload.new.start_hour ?? 9,
              end_hour: payload.new.end_hour ?? 18,
              slot_minutes: payload.new.slot_minutes ?? 45,
              blocked_ranges: payload.new.blocked_ranges || []
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isDemoMode]);

  const addAppointment = async (newApp) => {
    if (isDemoMode) {
      const currentPats = JSON.parse(localStorage.getItem('psico_pats')) || patients;
      const pat = currentPats.find(p => p.id === newApp.patient_id) || { full_name: 'Paciente Desconocido' };
      const app = { ...newApp, id: `app-${Date.now()}`, patient: pat };
      const updated = [...appointments, app];
      setAppointments(updated);
      localStorage.setItem('psico_apps', JSON.stringify(updated));
      return { data: app, error: null };
    }

    const { data, error } = await supabase
      .from('appointments')
      .insert([newApp])
      .select('*, patient:patients(*)')
      .single();
      
    if (!error && data) {
      setAppointments([...appointments, data]);
    }
    return { data, error };
  };

  const addPatient = async (newPatient) => {
    if (isDemoMode) {
      const patient = { ...newPatient, id: `pat-${Date.now()}`, created_at: new Date().toISOString() };
      const updated = [...patients, patient];
      setPatients(updated);
      localStorage.setItem('psico_pats', JSON.stringify(updated));
      return { data: patient, error: null };
    }

    const { data, error } = await supabase
      .from('patients')
      .insert([newPatient])
      .select()
      .single();
      
    if (!error && data) {
      setPatients([...patients, data]);
    }
    return { data, error };
  };

  const updatePatient = async (id, updatedFields) => {
    if (isDemoMode) {
      const updated = patients.map(p => p.id === id ? { ...p, ...updatedFields } : p);
      setPatients(updated);
      localStorage.setItem('psico_pats', JSON.stringify(updated));
      
      // Update nested references in appointments for UI
      const updatedApps = appointments.map(app => 
        app.patient_id === id ? { ...app, patient: { ...app.patient, ...updatedFields } } : app
      );
      setAppointments(updatedApps);
      if (isDemoMode) localStorage.setItem('psico_apps', JSON.stringify(updatedApps));
      
      return { data: updated.find(p => p.id === id), error: null };
    }

    const { data, error } = await supabase
      .from('patients')
      .update(updatedFields)
      .eq('id', id)
      .select()
      .single();
      
    if (!error && data) {
      setPatients(patients.map(p => p.id === id ? { ...p, ...data } : p));
      
      const updatedApps = appointments.map(app => 
        app.patient_id === id ? { ...app, patient: { ...app.patient, ...data } } : app
      );
      setAppointments(updatedApps);
    }
    return { data, error };
  };

  const cancelAppointment = async (appId) => {
    if (isDemoMode) {
      const updated = appointments.map(app => 
        app.id === appId ? { ...app, status: 'cancelled' } : app
      );
      setAppointments(updated);
      localStorage.setItem('psico_apps', JSON.stringify(updated));
      return { data: true, error: null };
    }

    const { data, error } = await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', appId)
      .select();

    if (!error) {
      setAppointments(appointments.map(app => app.id === appId ? { ...app, status: 'cancelled' } : app));
      
      // Add notification automatically
      await supabase.from('notifications').insert([{
        user_id: user.id,
        title: 'Cita Cancelada',
        message: 'Se ha cancelado una cita programada.',
        type: 'warning'
      }]);
    }
    return { data, error };
  };

  const markAppointmentComplete = async (appId) => {
    if (isDemoMode) {
      const updated = appointments.map(app =>
        app.id === appId ? { ...app, status: 'completed' } : app
      );
      setAppointments(updated);
      localStorage.setItem('psico_apps', JSON.stringify(updated));
      return { error: null };
    }

    const { error } = await supabase
      .from('appointments')
      .update({ status: 'completed' })
      .eq('id', appId);

    if (!error) {
      setAppointments(prev =>
        prev.map(app => app.id === appId ? { ...app, status: 'completed' } : app)
      );
    }
    return { error };
  };

  const deletePatient = async (id) => {
    if (isDemoMode) {
      const updatedPats = patients.filter(p => p.id !== id);
      setPatients(updatedPats);
      localStorage.setItem('psico_pats', JSON.stringify(updatedPats));
      
      const updatedApps = appointments.filter(app => app.patient_id !== id);
      setAppointments(updatedApps);
      localStorage.setItem('psico_apps', JSON.stringify(updatedApps));
      
      return { error: null };
    }

    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', id);

    if (!error) {
      setPatients(patients.filter(p => p.id !== id));
      setAppointments(appointments.filter(app => app.patient_id !== id));
    }
    return { error };
  };

  const saveSchedule = async (newSchedule) => {
    if (isDemoMode) {
      setSchedule(newSchedule);
      localStorage.setItem('psico_schedule', JSON.stringify(newSchedule));
      return { data: newSchedule, error: null };
    }

    const { data, error } = await supabase
      .from('app_config')
      .update({
        start_hour: newSchedule.start_hour,
        end_hour: newSchedule.end_hour,
        slot_minutes: newSchedule.slot_minutes,
        blocked_ranges: newSchedule.blocked_ranges || [],
        updated_at: new Date().toISOString()
      })
      .eq('id', 1)
      .select()
      .single();

    if (!error && data) {
      setSchedule({
        start_hour: data.start_hour,
        end_hour: data.end_hour,
        slot_minutes: data.slot_minutes,
        blocked_ranges: data.blocked_ranges || []
      });
    }
    return { data, error };
  };

  return (
    <AppContext.Provider value={{
      appointments,
      patients,
      notifications,
      schedule,
      loading,
      addAppointment,
      addPatient,
      updatePatient,
      deletePatient,
      cancelAppointment,
      markAppointmentComplete,
      fetchData,
      saveSchedule,
      isDemoMode,
      setPatients
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
