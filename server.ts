import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  getHospitalState,
  updateBedStatus,
  updateDoctorStatus,
  addDoctor,
  updateDoctor,
  deleteDoctor,
  updateAppointmentStatus,
  getAppointmentById,
  updateDoctorSchedule,
  addPatient,
  addAppointment,
  seedDatabase,
  addUser,
  findUserByEmail,
  addMessage
} from "./src/db.ts";
import { ServerEvent } from "./src/types.ts";

async function startServer() {
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ server });
  const PORT = 3000;

  app.use(express.json());

  // Broadcast to all connected clients
  const broadcast = (event: ServerEvent) => {
    const message = JSON.stringify(event);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  };

  // API Routes
  app.get("/api/state", async (req, res) => {
    try {
      const state = await getHospitalState();
      res.json(state);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch state' });
    }
  });

  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password, name, role } = req.body;
      const existingUser = await findUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      const userId = `u-${Date.now()}`;
      let referenceId = null;

      if (role === 'doctor') {
        referenceId = `d-${Date.now()}`;
        await addDoctor({ id: referenceId, name, specialty: 'General', status: 'off-duty' });
      } else if (role === 'patient') {
        referenceId = `p-${Date.now()}`;
        // Patient might be added later with more details, but we can create a shell if needed
      }

      const newUser = { id: userId, email, password, name, role, referenceId };
      await addUser(newUser);

      res.json({ success: true, user: { id: userId, email, name, role, referenceId } });
    } catch (err) {
      res.status(500).json({ error: 'Signup failed' });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await findUserByEmail(email);

      if (!user || user.password !== password) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json({ success: true, user: userWithoutPassword });
    } catch (err) {
      res.status(500).json({ error: 'Login failed' });
    }
  });

  app.post("/api/simulate/admission", async (req, res) => {
    try {
      const { patient, bedId } = req.body;
      const state = await getHospitalState();

      let targetBed;
      if (bedId) {
        targetBed = state.beds.find(b => b.id === bedId && b.status === 'available');
      }

      if (!targetBed) {
        // Auto-assign bed based on severity if no specific bed requested or if requested bed is unavailable
        const preferredWardType = patient.severity === 'critical' ? 'ICU' : 'Normal';
        const targetWard = state.wards.find(w => w.type === preferredWardType) || state.wards[0];
        targetBed = state.beds.find(b => b.wardId === targetWard.id && b.status === 'available');
      }

      if (!targetBed) {
        return res.status(400).json({ success: false, message: "No beds available in the required ward." });
      }

      const patientWithBed = { ...patient, bedId: targetBed.id };
      await addPatient(patientWithBed);
      await updateBedStatus(targetBed.id, 'occupied', patient.id);

      broadcast({ type: 'PATIENT_UPDATE', payload: patientWithBed });
      broadcast({ type: 'BED_UPDATE', payload: { ...targetBed, status: 'occupied', patientId: patient.id } });
      broadcast({ type: 'ALERT', payload: { message: `Automated Admission: ${patient.name} assigned to ${targetBed.id}`, severity: 'info' } });

      res.json({ success: true, bedId: targetBed.id });
    } catch (err) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  app.post("/api/simulate/discharge", async (req, res) => {
    try {
      const { bedId } = req.body;
      const state = await getHospitalState();
      const bed = state.beds.find(b => b.id === bedId);

      if (bed && bed.patientId) {
        await updateBedStatus(bedId, 'cleaning', null);
        broadcast({ type: 'BED_UPDATE', payload: { ...bed, status: 'cleaning', patientId: null } });
        broadcast({ type: 'ALERT', payload: { message: `Patient discharged from ${bedId}. Bed sent for cleaning.`, severity: 'info' } });
      }

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  app.post("/api/simulate/complete-task", async (req, res) => {
    try {
      const { bedId } = req.body;
      const state = await getHospitalState();
      const bed = state.beds.find(b => b.id === bedId);

      if (bed && (bed.status === 'cleaning' || bed.status === 'maintenance')) {
        await updateBedStatus(bedId, 'available', null);
        broadcast({ type: 'BED_UPDATE', payload: { ...bed, status: 'available', patientId: null } });
        broadcast({ type: 'ALERT', payload: { message: `Bed ${bedId} is now ready for admission.`, severity: 'info' } });
      }

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  // Doctor CRUD
  app.post("/api/doctors", async (req, res) => {
    try {
      const doctor = req.body;
      await addDoctor(doctor);
      broadcast({ type: 'DOCTOR_UPDATE', payload: doctor });
      broadcast({ type: 'ALERT', payload: { message: `New staff added: ${doctor.name}`, severity: 'info' } });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  app.put("/api/doctors/:id", async (req, res) => {
    try {
      const doctor = req.body;
      await updateDoctor(doctor);
      broadcast({ type: 'DOCTOR_UPDATE', payload: doctor });
      broadcast({ type: 'ALERT', payload: { message: `Staff updated: ${doctor.name}`, severity: 'info' } });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  app.delete("/api/doctors/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await deleteDoctor(id);
      const state = await getHospitalState();
      broadcast({ type: 'INITIAL_STATE', payload: state });
      broadcast({ type: 'ALERT', payload: { message: `Staff removed from system`, severity: 'warning' } });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  // Appointment routes
  app.post("/api/appointments", async (req, res) => {
    try {
      const appointment = req.body;
      await addAppointment(appointment);

      // Auto-accept high severity appointments
      if (appointment.severity === 'critical' || appointment.severity === 'high') {
        await updateAppointmentStatus(appointment.id, 'accepted');
        const updatedAppt = await getAppointmentById(appointment.id);

        const newPatient = {
          id: `p-${Date.now()}`,
          name: updatedAppt.patientName,
          age: updatedAppt.patientAge,
          condition: updatedAppt.condition,
          severity: updatedAppt.severity,
          admissionTime: new Date().toISOString(),
          bedId: null,
          doctorId: updatedAppt.doctorId
        };
        await addPatient(newPatient);

        broadcast({ type: 'APPOINTMENT_UPDATE', payload: updatedAppt });
        broadcast({ type: 'PATIENT_UPDATE', payload: newPatient });
        broadcast({ type: 'ALERT', payload: { message: `AI Auto-Accepted critical appointment for ${appointment.patientName}`, severity: 'info' } });
      } else {
        broadcast({ type: 'APPOINTMENT_UPDATE', payload: appointment });
        broadcast({ type: 'ALERT', payload: { message: `New appointment requested for ${appointment.patientName}`, severity: 'info' } });
      }

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  app.post("/api/appointments/:id/accept", async (req, res) => {
    try {
      const { id } = req.params;
      await updateAppointmentStatus(id, 'accepted');
      const appointment = await getAppointmentById(id);

      // Create a new patient record from the appointment
      const newPatient = {
        id: `p-${Date.now()}`,
        name: appointment.patientName,
        age: appointment.patientAge,
        condition: appointment.condition,
        severity: appointment.severity,
        admissionTime: new Date().toISOString(),
        bedId: null,
        doctorId: appointment.doctorId
      };
      await addPatient(newPatient);

      broadcast({ type: 'APPOINTMENT_UPDATE', payload: appointment });
      broadcast({ type: 'PATIENT_UPDATE', payload: newPatient });
      broadcast({ type: 'ALERT', payload: { message: `Appointment accepted and patient record created for ${appointment.patientName}`, severity: 'info' } });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  app.post("/api/appointments/:id/decline", async (req, res) => {
    try {
      const { id } = req.params;
      await updateAppointmentStatus(id, 'declined');
      const appointment = await getAppointmentById(id);
      broadcast({ type: 'APPOINTMENT_UPDATE', payload: appointment });
      broadcast({ type: 'ALERT', payload: { message: `Appointment declined for ${appointment.patientName}`, severity: 'warning' } });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  app.post("/api/appointments/:id/cancel", async (req, res) => {
    try {
      const { id } = req.params;
      await updateAppointmentStatus(id, 'cancelled');
      const appointment = await getAppointmentById(id);
      broadcast({ type: 'APPOINTMENT_UPDATE', payload: appointment });
      broadcast({ type: 'ALERT', payload: { message: `Appointment cancelled for ${appointment.patientName}`, severity: 'warning' } });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  app.post("/api/appointments/:id/complete", async (req, res) => {
    try {
      const { id } = req.params;
      await updateAppointmentStatus(id, 'completed');
      const appointment = await getAppointmentById(id);
      broadcast({ type: 'APPOINTMENT_UPDATE', payload: appointment });
      broadcast({ type: 'ALERT', payload: { message: `Appointment completed for ${appointment.patientName}`, severity: 'info' } });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  app.post("/api/messages", async (req, res) => {
    try {
      const message = req.body;
      await addMessage(message);
      broadcast({ type: 'MESSAGE_UPDATE', payload: message });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  app.put("/api/doctors/:id/schedule", async (req, res) => {
    try {
      const { id } = req.params;
      const { shiftStart, shiftEnd } = req.body;
      await updateDoctorSchedule(id, shiftStart, shiftEnd);
      const state = await getHospitalState();
      const doctor = state.doctors.find(d => d.id === id);
      broadcast({ type: 'DOCTOR_UPDATE', payload: doctor as any });
      broadcast({ type: 'ALERT', payload: { message: `Schedule updated for ${doctor?.name}`, severity: 'info' } });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  // AI Diagnostic Assistant Route
  app.post("/api/ai/diagnose", async (req, res) => {
    try {
      const { symptoms, history, patientData } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ error: "Gemini API key is not configured." });
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

      const prompt = `
        You are a highly advanced Medical AI Diagnostic Assistant named "PulsePoint AI".
        Your role is to assist doctors with clinical decision-making.

        PATIENT DATA:
        - Current Symptoms: ${symptoms}
        - Medical History: ${history || 'None provided'}
        - Real-time Vitals: ${JSON.stringify(patientData || 'N/A')}

        TASK:
        1. Analyze the symptoms and data.
        2. Provide 3-4 Differential Diagnoses (ranked by probability).
        3. Include a specific section for "SKIN CONDITION ANALYSIS".
        4. Include a specific section for "OPTIMAL WATER INTAKE" based on the patient's condition.
        5. Suggest exactly 2 medical or lifestyle PRODUCTS that could assist the patient.
        6. Provide immediate Treatment Protocols or further Diagnostic Tests.
        7. Provide a "Risk Level" (Low, Medium, High, Critical).

        FORMAT:
        Use Markdown. Be professional, concise, and technical (for doctors).
        Structure the report with clear headers for SKIN, WATER, and PRODUCTS.
        Always include a disclaimer that this is AI-assisted and requires clinical verification.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      res.json({ success: true, diagnosis: text });
    } catch (err) {
      console.error("AI Diagnosis Error:", err);
      res.status(500).json({ error: "AI failed to process the diagnostic request." });
    }
  });

  // WebSocket connection handling
  wss.on("connection", async (ws) => {
    console.log("Client connected");
    // Send initial state
    try {
      const state = await getHospitalState();
      ws.send(JSON.stringify({ type: 'INITIAL_STATE', payload: state }));
    } catch (err) {
      console.error('Failed to get initial state for client', err);
    }

    ws.on("close", () => console.log("Client disconnected"));
  });

  // Simulation loop for dynamic updates
  setInterval(async () => {
    try {
      const state = await getHospitalState();

      // Calculated Predictive Capacity (Advanced Function)
      const totalBedsCount = state.beds.length;
      const occupiedBedsCount = state.beds.filter(b => b.status === 'occupied').length;
      const criticalCount = state.patients.filter(p => p.severity === 'critical').length;

      // Heuristic for predictive load in 2 hours
      const predictiveLoad = Math.min(100, Math.round((occupiedBedsCount / totalBedsCount) * 100 + (criticalCount * 2) + (Math.random() * 5)));

      broadcast({
        type: 'ALERT', payload: {
          message: `AI Predictive Analysis: Facility load projected at ${predictiveLoad}% in next 2 hours.`,
          severity: predictiveLoad > 85 ? 'warning' : 'info'
        } as any
      });

      // Randomly change a doctor's status with more logic
      if (state.doctors.length > 0) {
        const doc = state.doctors[Math.floor(Math.random() * state.doctors.length)];
        const statuses = ['on-duty', 'on-break', 'in-surgery', 'off-duty'];

        // Don't put everyone off-duty
        let newStatus = statuses[Math.floor(Math.random() * statuses.length)];
        if (newStatus === 'off-duty' && state.doctors.filter(d => d.status === 'on-duty').length < 3) {
          newStatus = 'on-duty';
        }

        await updateDoctorStatus(doc.id, newStatus);
        broadcast({ type: 'DOCTOR_UPDATE', payload: { ...doc, status: newStatus as any } });
      }

      // Bed Status Management
      const cleaningBeds = state.beds.filter(b => b.status === 'cleaning');
      if (cleaningBeds.length > 0 && Math.random() > 0.5) {
        const bed = cleaningBeds[Math.floor(Math.random() * cleaningBeds.length)];
        await updateBedStatus(bed.id, 'available', null);
        broadcast({ type: 'BED_UPDATE', payload: { ...bed, status: 'available', patientId: null } });
        broadcast({ type: 'ALERT', payload: { message: `Sanitization Complete: Bed ${bed.id} is now sterile and available.`, severity: 'info' } });
      }

      // Random Medical Events
      if (Math.random() > 0.8) {
        const events = [
          { message: "High occupancy alert in ICU Alpha - Triage redirecting to Ward B", severity: "warning" },
          { message: "Diagnostic Sync: Radiology Node 04 maintenance complete", severity: "info" },
          { message: "Code Blue Simulation: Response time optimized to 118 seconds", severity: "info" },
          { message: "Emergency Department: Surge in respiratory cases detected", severity: "error" },
          { message: "Pharmacy: Critical stock of Epinephrine at 15%", severity: "error" }
        ];
        const event = events[Math.floor(Math.random() * events.length)];
        broadcast({ type: 'ALERT', payload: event as any });
      }
    } catch (err) {
      console.error('Simulation loop error', err);
    }
  }, 8000);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
