import { createClient } from '@supabase/supabase-js';
import { HospitalState } from './types';

// Supabase Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('⚠️ Supabase credentials missing. Database will not work until you add SUPABASE_URL and SUPABASE_ANON_KEY to .env');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Seed data and setup
export async function seedDatabase() {
    try {
        const { count, error } = await supabase.from('wards').select('*', { count: 'exact', head: true });
        
        if (error || count === 0) {
            console.log('🌱 Seeding Supabase database...');
            
            // Wards
            const wardsData = [
                { id: 'w1', name: 'ICU Alpha', type: 'ICU', capacity: 12 },
                { id: 'w2', name: 'Normal Ward B', type: 'Normal', capacity: 24 },
                { id: 'w3', name: 'Standard Unit', type: 'Standard', capacity: 18 },
            ];
            await supabase.from('wards').upsert(wardsData);

            // Beds
            const bedsData: any[] = [];
            wardsData.forEach(w => {
                for (let i = 1; i <= w.capacity; i++) {
                    const isOccupied = Math.random() > 0.4;
                    bedsData.push({
                        id: `${w.id}-b${i}`,
                        wardId: w.id,
                        status: isOccupied ? 'occupied' : 'available',
                        patientId: null
                    });
                }
            });
            await supabase.from('beds').upsert(bedsData);

            // Doctors
            const doctorsData = [
                { id: 'd1', name: 'Dr. Sarah Chen', specialty: 'Cardiology', status: 'on-duty', shiftStart: '08:00', shiftEnd: '16:00' },
                { id: 'd2', name: 'Dr. James Wilson', specialty: 'Neurology', status: 'on-duty', shiftStart: '08:00', shiftEnd: '16:00' },
                { id: 'd3', name: 'Dr. Elena Rodriguez', specialty: 'Pediatrics', status: 'on-duty', shiftStart: '08:00', shiftEnd: '16:00' },
                { id: 'd4', name: 'Dr. Michael Chang', specialty: 'Emergency Medicine', status: 'in-surgery', shiftStart: '08:00', shiftEnd: '16:00' },
                { id: 'd5', name: 'Dr. Emily Blunt', specialty: 'General Surgery', status: 'on-break', shiftStart: '08:00', shiftEnd: '16:00' },
            ];
            await supabase.from('doctors').upsert(doctorsData);

            // Patients
            const patientsData = [
                { id: 'p1', name: 'John Doe', age: 45, condition: 'Post-Op Recovery', severity: 'medium', admissionTime: new Date(Date.now() - 3600000 * 4).toISOString(), bedId: 'w2-b1' },
                { id: 'p2', name: 'Jane Smith', age: 32, condition: 'Acute Respiratory Distress', severity: 'critical', admissionTime: new Date(Date.now() - 3600000 * 2).toISOString(), bedId: 'w1-b1' },
            ];
            await supabase.from('patients').upsert(patientsData);

            // Equipment
            const equipmentData = [
                { id: 'e1', name: 'Ventilator V100', type: 'Life Support', location: 'w1', status: 'active', battery: 85 },
                { id: 'e2', name: 'Portable X-Ray', type: 'Imaging', location: 'w2', status: 'idle', battery: 92 },
            ];
            await supabase.from('equipment').upsert(equipmentData);

            // Users
            const usersData = [
                { id: 'u1', email: 'doctor@pulse.com', password: 'password123', name: 'Dr. Sarah Chen', role: 'doctor', referenceId: 'd1' },
                { id: 'u2', email: 'patient@pulse.com', password: 'password123', name: 'John Doe', role: 'patient', referenceId: 'p1' },
            ];
            await supabase.from('users').upsert(usersData);
            
            console.log('✅ Supabase seeding complete');
        }
    } catch (err) {
        console.error('❌ Supabase error:', err);
    }
}

export async function getHospitalState(): Promise<HospitalState> {
    const { data: wards } = await supabase.from('wards').select('*');
    const { data: beds } = await supabase.from('beds').select('*');
    const { data: patients } = await supabase.from('patients').select('*');
    const { data: doctors } = await supabase.from('doctors').select('*');
    const { data: equipment } = await supabase.from('equipment').select('*');
    const { data: appointments } = await supabase.from('appointments').select('*');
    const { data: messages } = await supabase.from('messages').select('*');

    return {
        wards: wards || [],
        beds: beds || [],
        patients: patients || [],
        doctors: doctors || [],
        equipment: equipment || [],
        appointments: appointments || [],
        messages: messages || []
    } as any;
}

export async function updateBedStatus(id: string, status: string, patientId: string | null) {
    await supabase.from('beds').update({ status, patientId }).eq('id', id);
}

export async function addPatient(patient: any) {
    await supabase.from('patients').insert([patient]);
}

export async function updatePatientDoctor(id: string, doctorId: string | null) {
    await supabase.from('patients').update({ doctorId }).eq('id', id);
}

export async function updateDoctorStatus(id: string, status: string) {
    await supabase.from('doctors').update({ status }).eq('id', id);
}

export async function addDoctor(doctor: any) {
    await supabase.from('doctors').insert([{
        ...doctor,
        shiftStart: doctor.shiftStart || '08:00',
        shiftEnd: doctor.shiftEnd || '16:00'
    }]);
}

export async function updateDoctor(doctor: any) {
    await supabase.from('doctors').update({
        name: doctor.name,
        specialty: doctor.specialty,
        status: doctor.status,
        shiftStart: doctor.shiftStart || '08:00',
        shiftEnd: doctor.shiftEnd || '16:00'
    }).eq('id', doctor.id);
}

export async function updateDoctorSchedule(id: string, shiftStart: string, shiftEnd: string) {
    await supabase.from('doctors').update({ shiftStart, shiftEnd }).eq('id', id);
}

export async function deleteDoctor(id: string) {
    await supabase.from('doctors').delete().eq('id', id);
}

export async function updateAppointmentStatus(id: string, status: string) {
    await supabase.from('appointments').update({ status }).eq('id', id);
}

export async function getAppointmentById(id: string) {
    const { data } = await supabase.from('appointments').select('*').eq('id', id).single();
    return data;
}

export async function addAppointment(appointment: any) {
    await supabase.from('appointments').insert([appointment]);
}

export async function addUser(user: any) {
    await supabase.from('users').insert([user]);
}

export async function findUserByEmail(email: string) {
    const { data } = await supabase.from('users').select('*').eq('email', email).single();
    return data;
}

export async function addMessage(message: any) {
    await supabase.from('messages').insert([message]);
}
