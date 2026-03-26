const Agenda = require('../models/Agenda');
const multer  = require('multer');

// Store uploads in memory so we can save the buffer to MongoDB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 16 * 1024 * 1024 }, // 16 MB max per file
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') return cb(null, true);
    cb(new Error('Only PDF files are allowed'));
  },
});

// Export the multer middleware so the router can use it
exports.uploadMiddleware = upload.fields([
  { name: 'oldAgenda', maxCount: 1 },
  { name: 'newAgenda', maxCount: 1 },
]);

// Helper: strip binary data before sending to client
const safe = (doc) => {
  const obj = doc.toObject();
  if (obj.oldAgenda) delete obj.oldAgenda.data;
  if (obj.newAgenda) delete obj.newAgenda.data;
  return obj;
};

// GET /api/agendas?sucId=&year=
// Returns all quarters for a given SUC + year (no file binary data)
exports.getAgendas = async (req, res) => {
  try {
    const { sucId, year } = req.query;
    if (!sucId || !year) return res.status(400).json({ message: 'sucId and year are required' });
    const docs = await Agenda.find({ sucId, year: parseInt(year) }).select('-oldAgenda.data -newAgenda.data');
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/agendas/:sucId/:quarter
// Upsert agenda files for a quarter. Body (multipart): year, sucName; Files: oldAgenda?, newAgenda?
exports.uploadFiles = async (req, res) => {
  try {
    const { sucId, quarter } = req.params;
    const year    = parseInt(req.body.year);
    const sucName = req.body.sucName || '';

    if (!year) return res.status(400).json({ message: 'year is required' });

    let doc = await Agenda.findOne({ sucId, year, quarter });
    if (!doc) doc = new Agenda({ sucId, sucName, year, quarter });

    if (req.files?.oldAgenda?.[0]) {
      const f = req.files.oldAgenda[0];
      doc.oldAgenda = { filename: f.originalname, data: f.buffer, contentType: f.mimetype, uploadedAt: new Date() };
    }
    if (req.files?.newAgenda?.[0]) {
      const f = req.files.newAgenda[0];
      doc.newAgenda = { filename: f.originalname, data: f.buffer, contentType: f.mimetype, uploadedAt: new Date() };
    }

    await doc.save();
    res.json(safe(doc));
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

// DELETE /api/agendas/:sucId/:quarter?year=
// Clears both files for a quarter
exports.resetFiles = async (req, res) => {
  try {
    const { sucId, quarter } = req.params;
    const year = parseInt(req.query.year);
    if (!year) return res.status(400).json({ message: 'year is required' });
    await Agenda.findOneAndDelete({ sucId, year, quarter });
    res.json({ message: 'Reset successful' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/agendas/status
// Returns uploaded agenda identifiers (sucAbbreviation, year, quarter/slot, type) for the requesting user's visible SUCs
exports.getAgendaStatus = async (req, res) => {
  try {
    const Suc      = require('../models/Suc');
    const Document = require('../models/Document');

    const sucFilter = {};
    if (req.user.role === 'admin' && req.user.occCode) {
      sucFilter.occCode = req.user.occCode;
    } else if (req.user.role === 'user' && req.user.sucAbbreviation) {
      sucFilter.abbreviation = req.user.sucAbbreviation;
    }

    const visibleSucs = await Suc.find(sucFilter).select('_id abbreviation');
    const sucIdMap = {};
    visibleSucs.forEach((s) => { sucIdMap[s._id.toString()] = s.abbreviation; });
    const sucIds = visibleSucs.map((s) => s._id);

    const [agendas, docs] = await Promise.all([
      Agenda.find({ sucId: { $in: sucIds } }).select('sucId year quarter'),
      Document.find({ sucId: { $in: sucIds }, pageType: 'special', slot: { $in: ['1st', '2nd'] } }).select('sucId year slot'),
    ]);

    const result = [
      ...agendas.map((a) => ({
        sucAbbreviation: sucIdMap[a.sucId.toString()],
        year: a.year,
        quarter: a.quarter,
        type: 'regular',
      })),
      ...docs.map((d) => ({
        sucAbbreviation: sucIdMap[d.sucId.toString()],
        year: d.year,
        slot: d.slot,
        type: 'special',
      })),
    ];

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/agendas/file/:agendaId/:type  (type = old | new)
// Streams the PDF to the browser.
// Supports query-param token for browser-opened tabs: ?token=...
exports.serveFile = async (req, res) => {
  try {
    const { agendaId, type } = req.params;
    const doc = await Agenda.findById(agendaId);
    if (!doc) return res.status(404).json({ message: 'Not found' });

    const file = type === 'old' ? doc.oldAgenda : doc.newAgenda;
    if (!file?.data) return res.status(404).json({ message: 'No file uploaded for this slot' });

    res.set('Content-Type', file.contentType || 'application/pdf');
    res.set('Content-Disposition', `inline; filename="${encodeURIComponent(file.filename)}"`);
    res.send(file.data);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
