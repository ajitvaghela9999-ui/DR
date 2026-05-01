---
description: Start the PulsePoint Digital Twin reliably
---

This workflow automates the process of checking prerequisites and starting the project correctly.

1. **Check for MongoDB Service**
// turbo
Run the following command to check if MongoDB is running:
```powershell
Get-Service -Name MongoDB | Where-Object {$_.Status -eq 'Running'}
```
*If not running, start it from Services.msc.*

2. **Check for Port Conflicts**
// turbo
Check if port 3000 is currently in use:
```powershell
netstat -ano | findstr :3000
```
*If you see any processes, kill them with `taskkill /F /PID <PID>`.*

3. **Install Dependencies (if needed)**
If `node_modules` is not present, run:
```bash
npm install
```

4. **Start the Project**
// turbo
Start the server and frontend together:
```bash
npx tsx server.ts
```
*You should see 'Connected to MongoDB' and 'Server running on http://localhost:3000' in the terminal.*
