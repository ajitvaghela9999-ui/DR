export interface Ward {
  id: string;
  name: string;
  type: 'ICU' | 'Normal' | 'Standard';
  capacity: number;
}

export interface Bed {
  id: string;
  wardId: string;
  status: 'available' | 'occupied' | 'cleaning' | 'maintenance';
  patientId?: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  condition: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  admissionTime: string;
  bedId?: string;
  doctorId?: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  status: 'on-duty' | 'off-duty' | 'in-surgery' | 'on-break';
  shiftStart: string;
  shiftEnd: string;
}

export interface Equipment {
  id: string;
  name: string;
  type: string;
  location: string;
  status: 'active' | 'idle' | 'maintenance' | 'in-use';
  battery: number;
}

export interface Appointment {
  id: string;
  patientName: string;
  patientAge: number;
  condition: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  doctorId: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled' | 'completed';
  requestTime: string;
}

export interface ChatMessage {
  id: string;
  appointmentId: string;
  senderRole: 'doctor' | 'patient';
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
}

export interface HospitalState {
  wards: Ward[];
  beds: Bed[];
  patients: Patient[];
  doctors: Doctor[];
  equipment: Equipment[];
  appointments: Appointment[];
  messages: ChatMessage[];
}

export type ServerEvent =
  | { type: 'INITIAL_STATE'; payload: HospitalState }
  | { type: 'BED_UPDATE'; payload: Bed }
  | { type: 'PATIENT_UPDATE'; payload: Patient }
  | { type: 'DOCTOR_UPDATE'; payload: Doctor }
  | { type: 'EQUIPMENT_UPDATE'; payload: Equipment }
  | { type: 'APPOINTMENT_UPDATE'; payload: Appointment }
  | { type: 'MESSAGE_UPDATE'; payload: ChatMessage }
  | { type: 'ALERT'; payload: { message: string; severity: 'info' | 'warning' | 'error' } };

export interface User {
  id: string;
  email: string;
  password?: string;
  name: string;
  role: 'doctor' | 'patient' | 'admin';
  referenceId?: string; // id of Doctor or Patient in their respective collections
}
