const Document = require('../models/Document');
const multer   = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 16 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') return cb(null, true);
    cb(new Error('Only PDF files are allowed'));
  },
});

exports.uploadMiddleware = upload.single('file');

const safe = (doc) => {
  const obj = doc.toObject();
  if (obj.file) delete obj.file.data;
  return obj;
};

// GET /api/documents?sucId=&year=&pageType=
exports.getDocs = async (req, res) => {
  try {
    const { sucId, year, pageType } = req.query;
    if (!sucId || !year || !pageType)
      return res.status(400).json({ message: 'sucId, year and pageType are required' });
    const docs = await Document.find({ sucId, year: parseInt(year), pageType }).select('-file.data');
    res.json(docs);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/documents/:sucId/:pageType/:slot
exports.uploadFile = async (req, res) => {
  try {
    const { sucId, pageType, slot } = req.params;
    const year    = parseInt(req.body.year);
    const sucName = req.body.sucName || '';
    if (!year) return res.status(400).json({ message: 'year is required' });
    let doc = await Document.findOne({ sucId, year, pageType, slot });
    if (!doc) doc = new Document({ sucId, sucName, year, pageType, slot });
    if (req.file) {
      doc.file = {
        filename:    req.file.originalname,
        data:        req.file.buffer,
        contentType: req.file.mimetype,
        uploadedAt:  new Date(),
      };
    }
    await doc.save();
    res.json(safe(doc));
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

// DELETE /api/documents/:sucId/:pageType/:slot?year=
exports.resetFile = async (req, res) => {
  try {
    const { sucId, pageType, slot } = req.params;
    const year = parseInt(req.query.year);
    if (!year) return res.status(400).json({ message: 'year is required' });
    await Document.findOneAndDelete({ sucId, year, pageType, slot });
    res.json({ message: 'Reset successful' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/documents/file/:docId   (also accepts ?token= query for window.open)
exports.serveFile = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.docId);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    if (!doc.file?.data) return res.status(404).json({ message: 'No file uploaded' });
    res.set('Content-Type', doc.file.contentType || 'application/pdf');
    res.set('Content-Disposition', `inline; filename="${encodeURIComponent(doc.file.filename)}"`);
    res.send(doc.file.data);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};
