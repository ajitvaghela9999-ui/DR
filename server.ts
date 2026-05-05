import "dotenv/config";
import express from "express";
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
} from "./src/db";
import { ServerEvent } from "./src/types";

const app = express();
const server = createServer(app);
const PORT = 3000;

// Only initialize WebSocket if not on Vercel
let wss: WebSocketServer | null = null;
if (process.env.VERCEL !== "1") {
  wss = new WebSocketServer({ server });
  
  wss.on("connection", async (ws) => {
    console.log("Client connected");
    try {
      const state = await getHospitalState();
      ws.send(JSON.stringify({ type: 'INITIAL_STATE', payload: state }));
    } catch (err) {
      console.error('Failed to get initial state for client', err);
    }
    ws.on("close", () => console.log("Client disconnected"));
  });
}

app.use(express.json());

// Broadcast to all connected clients
const broadcast = (event: ServerEvent) => {
  const message = JSON.stringify(event);
  if (wss) {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
};

// API Router
const apiRouter = express.Router();

apiRouter.get("/state", async (req, res) => {
  try {
    const state = await getHospitalState();
    res.json(state);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch state' });
  }
});

apiRouter.post("/auth/signup", async (req, res) => {
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
    }

    const newUser = { id: userId, email, password, name, role, referenceId };
    await addUser(newUser);

    res.json({ success: true, user: { id: userId, email, name, role, referenceId } });
  } catch (err) {
    res.status(500).json({ error: 'Signup failed' });
  }
});

apiRouter.post("/auth/login", async (req, res) => {
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

apiRouter.post("/simulate/admission", async (req, res) => {
  try {
    const { patient, bedId } = req.body;
    const state = await getHospitalState();

    let targetBed;
    if (bedId) {
      targetBed = state.beds.find(b => b.id === bedId && b.status === 'available');
    }

    if (!targetBed) {
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

apiRouter.post("/simulate/discharge", async (req, res) => {
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

apiRouter.post("/simulate/complete-task", async (req, res) => {
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

apiRouter.post("/doctors", async (req, res) => {
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

apiRouter.put("/doctors/:id", async (req, res) => {
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

apiRouter.delete("/doctors/:id", async (req, res) => {
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

apiRouter.post("/appointments", async (req, res) => {
  try {
    const appointment = req.body;
    await addAppointment(appointment);
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

apiRouter.post("/messages", async (req, res) => {
  try {
    const message = req.body;
    await addMessage(message);
    broadcast({ type: 'MESSAGE_UPDATE', payload: message });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
});

apiRouter.post("/ai/diagnose", async (req, res) => {
  try {
    const { symptoms, history, patientData } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Gemini API key is not configured." });
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const prompt = `You are a highly advanced Medical AI Diagnostic Assistant named "PulsePoint AI". ... (truncated)`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    res.json({ success: true, diagnosis: response.text() });
  } catch (err) {
    res.status(500).json({ error: "AI failed to process the diagnostic request." });
  }
});

// Mount the API Router at both /api and root for maximum compatibility
app.use("/api", apiRouter);
app.use("/", apiRouter);

// Simulation loop (local only)
if (process.env.VERCEL !== "1") {
  setInterval(async () => {
    try {
      const state = await getHospitalState();
      // ... same simulation logic ...
    } catch (err) {}
  }, 8000);
}

// Development vs Production
if (process.env.NODE_ENV !== "production") {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
  app.use(vite.middlewares);
} else {
  app.use(express.static("dist"));
}

if (process.env.VERCEL !== "1") {
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
