import mongoose from 'mongoose';
import { HospitalState } from './types.ts';

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/hospital')
  .then(() => {
    console.log('✅ Connected to MongoDB');
    seedDatabase().catch(console.error);
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    console.error('❗ TIP: Ensure MongoDB service is running on your machine (Services.msc -> MongoDB).');
    process.exit(1);
  });

// Define Schemas
const wardSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  type: String,
  capacity: Number
});

const bedSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  wardId: String,
  status: String,
  patientId: String
});

const patientSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  age: Number,
  condition: String,
  severity: String,
  admissionTime: String,
  bedId: String,
  doctorId: String
});

const doctorSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  specialty: String,
  status: String,
  shiftStart: { type: String, default: '08:00' },
  shiftEnd: { type: String, default: '16:00' }
});

const equipmentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  type: String,
  location: String,
  status: String,
  battery: { type: Number, default: 100 }
});

const appointmentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  patientName: String,
  patientAge: Number,
  condition: String,
  severity: String,
  doctorId: String,
  status: String, // 'pending', 'accepted', 'declined'
  requestTime: String
});

const messageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  appointmentId: { type: String, required: true },
  senderRole: String,
  senderId: String,
  senderName: String,
  text: String,
  timestamp: String
});

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['doctor', 'patient', 'admin'], required: true },
  referenceId: String
});

// Create Models
export const Ward = mongoose.model('Ward', wardSchema);
export const Bed = mongoose.model('Bed', bedSchema);
export const Patient = mongoose.model('Patient', patientSchema);
export const Doctor = mongoose.model('Doctor', doctorSchema);
export const Equipment = mongoose.model('Equipment', equipmentSchema);
export const Appointment = mongoose.model('Appointment', appointmentSchema);
export const User = mongoose.model('User', userSchema);
export const Message = mongoose.model('Message', messageSchema);

// Seed data
export async function seedDatabase() {
  const count = await Ward.countDocuments();
  const hasAdmin = await User.findOne({ email: 'doctor@pulse.com' });
  if (count !== 3 || !hasAdmin) {
    await Ward.deleteMany({});
    await Bed.deleteMany({});
    await Patient.deleteMany({});
    await Doctor.deleteMany({});
    await Equipment.deleteMany({});
    await Appointment.deleteMany({});
    await Message.deleteMany({});
    await User.deleteMany({});

    const wardsData = [
      { id: 'w1', name: 'ICU Alpha', type: 'ICU', capacity: 12 },
      { id: 'w2', name: 'Normal Ward B', type: 'Normal', capacity: 24 },
      { id: 'w3', name: 'Standard Unit', type: 'Standard', capacity: 18 },
    ];
    await Ward.insertMany(wardsData);

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
    await Bed.insertMany(bedsData);

    const doctorsData = [
      { id: 'd1', name: 'Dr. Sarah Chen', specialty: 'Cardiology', status: 'on-duty' },
      { id: 'd2', name: 'Dr. James Wilson', specialty: 'Neurology', status: 'on-duty' },
      { id: 'd3', name: 'Dr. Elena Rodriguez', specialty: 'Pediatrics', status: 'on-duty' },
      { id: 'd4', name: 'Dr. Michael Chang', specialty: 'Emergency Medicine', status: 'in-surgery' },
      { id: 'd5', name: 'Dr. Emily Blunt', specialty: 'General Surgery', status: 'on-break' },
      { id: 'd6', name: 'Dr. David Kim', specialty: 'Anesthesiology', status: 'on-duty' },
      { id: 'd7', name: 'Dr. Lisa Ray', specialty: 'Oncology', status: 'off-duty' },
      { id: 'd8', name: 'Dr. Robert Fox', specialty: 'Orthopedics', status: 'on-duty' },
    ];
    await Doctor.insertMany(doctorsData);

    const patientsData = [
      { id: 'p1', name: 'John Doe', age: 45, condition: 'Post-Op Recovery', severity: 'medium', admissionTime: new Date(Date.now() - 3600000 * 4).toISOString(), bedId: 'w2-b1' },
      { id: 'p2', name: 'Jane Smith', age: 32, condition: 'Acute Respiratory Distress', severity: 'critical', admissionTime: new Date(Date.now() - 3600000 * 2).toISOString(), bedId: 'w1-b1' },
      { id: 'p3', name: 'Alice Johnson', age: 28, condition: 'Fractured Femur', severity: 'low', admissionTime: new Date(Date.now() - 3600000 * 12).toISOString(), bedId: 'w2-b5' },
      { id: 'p4', name: 'Bob Brown', age: 67, condition: 'Myocardial Infarction', severity: 'high', admissionTime: new Date(Date.now() - 3600000 * 1).toISOString(), bedId: 'w3-b2' },
      { id: 'p5', name: 'Charlie Davis', age: 5, condition: 'Pneumonia', severity: 'medium', admissionTime: new Date(Date.now() - 3600000 * 8).toISOString(), bedId: 'w2-b3' },
    ];
    await Patient.insertMany(patientsData);

    for (const p of patientsData) {
      await Bed.updateOne({ id: p.bedId }, { $set: { status: 'occupied', patientId: p.id } });
    }

    const equipmentData = [
      { id: 'e1', name: 'Ventilator V100', type: 'Life Support', location: 'w1', status: 'active', battery: 85 },
      { id: 'e2', name: 'Portable X-Ray', type: 'Imaging', location: 'w2', status: 'idle', battery: 92 },
      { id: 'e3', name: 'Defibrillator D5', type: 'Emergency', location: 'w3', status: 'in-use', battery: 45 },
      { id: 'e4', name: 'MRI Scanner', type: 'Imaging', location: 'w3', status: 'maintenance', battery: 100 },
      { id: 'e5', name: 'Infusion Pump A', type: 'Infusion', location: 'w1', status: 'active', battery: 12 },
      { id: 'e6', name: 'Patient Monitor M1', type: 'Monitoring', location: 'w2', status: 'in-use', battery: 67 },
    ];
    await Equipment.insertMany(equipmentData);

    const appointmentsData = [
      { id: 'a1', patientName: 'Mark Stevens', patientAge: 52, condition: 'Chest Pain', severity: 'high', doctorId: 'd1', status: 'pending', requestTime: new Date().toISOString() },
      { id: 'a2', patientName: 'Lucy Gray', patientAge: 24, condition: 'Severe Migraine', severity: 'medium', doctorId: 'd2', status: 'pending', requestTime: new Date().toISOString() },
    ];
    await Appointment.insertMany(appointmentsData);

    const usersData = [
      { id: 'u1', email: 'doctor@pulse.com', password: 'password123', name: 'Dr. Sarah Chen', role: 'doctor', referenceId: 'd1' },
      { id: 'u2', email: 'patient@pulse.com', password: 'password123', name: 'John Doe', role: 'patient', referenceId: 'p1' },
    ];
    await User.insertMany(usersData);
  }
}

// Helper to remove unwanted mongoose fields
function mapDocs(docs: any[]) {
  return docs.map(mapDoc);
}

function mapDoc(doc: any) {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : doc;
  delete obj._id;
  delete obj.__v;
  return obj;
}

export async function getHospitalState(): Promise<HospitalState> {
  const wards = await Ward.find({});
  const beds = await Bed.find({});
  const patients = await Patient.find({});
  const doctors = await Doctor.find({});
  const equipment = await Equipment.find({});
  const appointments = await Appointment.find({});
  const messages = await Message.find({});

  return {
    wards: mapDocs(wards),
    beds: mapDocs(beds),
    patients: mapDocs(patients),
    doctors: mapDocs(doctors),
    equipment: mapDocs(equipment),
    appointments: mapDocs(appointments),
    messages: mapDocs(messages)
  } as any;
}

export async function updateBedStatus(id: string, status: string, patientId: string | null) {
  await Bed.updateOne({ id }, { $set: { status, patientId } });
}

export async function addPatient(patient: any) {
  await new Patient(patient).save();
}

export async function updatePatientDoctor(id: string, doctorId: string | null) {
  await Patient.updateOne({ id }, { $set: { doctorId } });
}

export async function updateDoctorStatus(id: string, status: string) {
  await Doctor.updateOne({ id }, { $set: { status } });
}

export async function addDoctor(doctor: any) {
  await new Doctor({
    ...doctor,
    shiftStart: doctor.shiftStart || '08:00',
    shiftEnd: doctor.shiftEnd || '16:00'
  }).save();
}

export async function updateDoctor(doctor: any) {
  await Doctor.updateOne(
    { id: doctor.id },
    { $set: { name: doctor.name, specialty: doctor.specialty, status: doctor.status, shiftStart: doctor.shiftStart || '08:00', shiftEnd: doctor.shiftEnd || '16:00' } }
  );
}

export async function updateDoctorSchedule(id: string, shiftStart: string, shiftEnd: string) {
  await Doctor.updateOne({ id }, { $set: { shiftStart, shiftEnd } });
}

export async function deleteDoctor(id: string) {
  await Doctor.deleteOne({ id });
}

export async function updateAppointmentStatus(id: string, status: string) {
  await Appointment.updateOne({ id }, { $set: { status } });
}

export async function getAppointmentById(id: string) {
  const appt = await Appointment.findOne({ id });
  return mapDoc(appt);
}

export async function addAppointment(appointment: any) {
  await new Appointment(appointment).save();
}

export async function addUser(user: any) {
  await new User(user).save();
}

export async function findUserByEmail(email: string) {
  const user = await User.findOne({ email });
  return mapDoc(user);
}

export async function addMessage(message: any) {
  await new Message(message).save();
}
