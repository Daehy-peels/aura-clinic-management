// src/types/index.ts

/**
 * Valid statuses for a clinical appointment
 */
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled';

/**
 * Represents a Patient at Aura Aesthetic Clinic
 */
export interface Patient {
  id: string;
  created_at: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  medical_history?: string; // The '?' means this is optional
}

/**
 * Represents a scheduled clinical session
 */
export interface Appointment {
  id: string;
  patient_id: string;
  scheduled_at: string;
  treatment_type: string;
  status: AppointmentStatus;
  notes?: string;
}

/**
 * Log of a specific procedure performed
 */
export interface TreatmentLog {
  id: string;
  patient_id: string;
  appointment_id: string;
  procedure_name: string;
  practitioner_name: string;
  date_performed: string;
  observations: string;
}