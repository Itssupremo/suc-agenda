const Document = require('../models/Document');
const multer   = require('multer');
const { uploadToS3, getFromS3, deleteFromS3 } = require('../utils/s3Storage');

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
      if (doc.file?.s3Key) {
        await deleteFromS3(doc.file.s3Key);
      }
      const s3Key = await uploadToS3(req.file.originalname, req.file.buffer, req.file.mimetype);
      doc.file = {
        filename:    req.file.originalname,
        data:        s3Key ? undefined : req.file.buffer,
        s3Key:       s3Key || undefined,
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
    
    const doc = await Document.findOne({ sucId, year, pageType, slot });
    if (doc) {
      if (doc.file?.s3Key) {
        await deleteFromS3(doc.file.s3Key);
      }
      await doc.deleteOne();
    }
    
    res.json({ message: 'Reset successful' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/documents/file/:docId   (also accepts ?token= query for window.open)
exports.serveFile = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.docId);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    if (!doc.file) return res.status(404).json({ message: 'No file uploaded' });
    if (!doc.file.s3Key && !doc.file.data) return res.status(404).json({ message: 'No file uploaded' });

    res.set('Content-Type', doc.file.contentType || 'application/pdf');
    res.set('Content-Disposition', `inline; filename="${encodeURIComponent(doc.file.filename)}"`);

    if (doc.file.s3Key) {
      const buffer = await getFromS3(doc.file.s3Key);
      if (!buffer) return res.status(404).json({ message: 'File not found in storage bucket' });
      res.send(buffer);
    } else {
      res.send(doc.file.data);
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
