const Database = require('better-sqlite3');
const db = new Database('hospital.db');
try {
    db.exec('ALTER TABLE equipment ADD COLUMN battery INTEGER DEFAULT 100');
    console.log('Added battery column');
} catch (e) {
    console.log('Battery column might already exist');
}
try {
    db.exec('DELETE FROM equipment');
    const insertEquip = db.prepare('INSERT INTO equipment (id, name, type, location, status, battery) VALUES (?, ?, ?, ?, ?, ?)');
    const equipment = [
        { id: 'e1', name: 'Ventilator V100', type: 'Life Support', location: 'ICU Alpha', status: 'active', battery: 85 },
        { id: 'e2', name: 'Portable X-Ray', type: 'Imaging', location: 'Normal Ward B', status: 'idle', battery: 92 },
        { id: 'e3', name: 'Defibrillator D5', type: 'Emergency', location: 'Standard Unit', status: 'in-use', battery: 45 },
        { id: 'e4', name: 'MRI Scanner', type: 'Imaging', location: 'Standard Unit', status: 'maintenance', battery: 100 },
        { id: 'e5', name: 'Infusion Pump A', type: 'Infusion', location: 'ICU Alpha', status: 'active', battery: 12 },
        { id: 'e6', name: 'Patient Monitor M1', type: 'Monitoring', location: 'Normal Ward B', status: 'in-use', battery: 67 },
    ];
    equipment.forEach(e => insertEquip.run(e.id, e.name, e.type, e.location, e.status, e.battery));
    console.log('Seeded new equipment data');
} catch (e) {
    console.error('Error seeding:', e);
}
db.close();
