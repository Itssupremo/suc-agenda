const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const XLSX = require('xlsx');
const User = require('./models/User');
const Suc = require('./models/Suc');

const users = [
  { username: 'Admin', password: 'IanGwapo', fullname: 'System Admin', role: 'admin', occCode: '' },
  { username: 'ocsca', password: 'ocsca123', fullname: 'Chairperson Shirley C. Agrupis', role: 'user', occCode: 'OCSCA' },
  { username: 'ocdra', password: 'ocdra123', fullname: 'Commissioner Desiderio R. Apag III', role: 'user', occCode: 'OCDRA' },
  { username: 'ocrpa', password: 'ocrpa123', fullname: 'Commissioner Ricmar P. Aquino', role: 'user', occCode: 'OCRPA' },
  { username: 'ocmqm', password: 'ocmqm123', fullname: 'Commissioner Myrna Q. Mallari', role: 'user', occCode: 'OCMQM' },
  { username: 'ocmao', password: 'ocmao123', fullname: 'Commissioner Michelle Aguilar-Ong', role: 'user', occCode: 'OCMAO' },
];

// Normalize inconsistent region values from the XLSX
const REGION_MAP = {
  'III': '3', 'Region 3': '3',
  'IV': '4', '4A': '4',
  'V': '5', 'Region 5': '5', 'Region 5 ': '5',
  'VI': '6',
  'VII': '7',
  'VIII': '8',
  'IX': '9',
  'X': '10',
  'XI': '11',
  'XII': '12',
  '13': 'CARAGA',
};

// OCC Officials lookup
const OCC_OFFICIALS = {
  'OCSCA': { name: 'Chairperson Shirley C. Agrupis', section: 'Chairperson' },
  'OCDRA': { name: 'Commissioner Desiderio R. Apag III', section: 'Commissioner' },
  'OCRPA': { name: 'Commissioner Ricmar P. Aquino', section: 'Commissioner' },
  'OCMQM': { name: 'Commissioner Myrna Q. Mallari', section: 'Commissioner' },
  'OCMAO': { name: 'Commissioner Michelle Aguilar-Ong', section: 'Commissioner' },
};

function normalizeRegion(raw) {
  const val = String(raw).trim();
  return REGION_MAP[val] || val;
}

function mapOcc(occ) {
  const entry = OCC_OFFICIALS[occ];
  return entry || { name: occ, section: 'Other' };
}

function loadSucsFromXlsx() {
  const filePath = path.join(__dirname, 'data', 'SUC DATABASE.xlsx');
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws);

  return rows.map((r) => ({
    sucName: (r['State College / University Name'] || '').trim(),
    abbreviation: (r['Abbreviation'] || '').trim(),
    region: normalizeRegion(r['SUCs Region']),
    address: '',
    president: (r['Name of President'] || '').trim(),
    email: (r['Email'] || '').trim(),
    contact: String(r['Number'] || '').trim(),
    boardSecretaryName: (r['Board Secretary Name'] || '').trim(),
    boardSecretaryEmail: (r['Email_1'] || '').trim(),
    boardSecretaryContact: String(r['Number_1'] || '').trim(),
    occCode: (r['OCC'] || '').trim(),
    chedOfficial: mapOcc((r['OCC'] || '').trim()).name,
    section: mapOcc((r['OCC'] || '').trim()).section,
  })).filter((s) => s.sucName);
}

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected for seeding');

    await User.deleteMany({});
    await Suc.deleteMany({});

    await User.create(users);

    const sucs = loadSucsFromXlsx();
    await Suc.insertMany(sucs);

    console.log(`Seed data inserted successfully! (${sucs.length} SUCs from XLSX)`);
    users.forEach(u => console.log(`${u.role === 'admin' ? 'Admin' : u.occCode}  => username: ${u.username}, password: ${u.password}`));
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err.message);
    process.exit(1);
  }
}

seed();
