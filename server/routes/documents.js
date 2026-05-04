const express = require('express');
const { ObjectId } = require('mongodb');
const multer = require('multer');
const { getDB } = require('../config/db');
const { protect, requireRole } = require('../middleware/auth');
const { analyzeDocument, chatWithDocument } = require('../services/claudeService');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    cb(null, allowed.includes(file.mimetype));
  },
});

// GET /api/documents/case/:id
router.get('/case/:id', protect, async (req, res) => {
  try {
    const db = getDB();
    const caseId = new ObjectId(req.params.id);
    let filter = { case: caseId };
    if (req.user.role === 'client') {
      filter.sharedWith = req.user._id;
    }
    const documents = await db.collection('documents').find(filter).sort({ createdAt: -1 }).toArray();
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/documents/upload
router.post('/upload', protect, requireRole('lawyer', 'admin'), upload.single('file'), async (req, res) => {
  try {
    const db = getDB();
    const { caseId, sharedWith } = req.body;
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const fileType = req.file.mimetype === 'application/pdf' ? 'pdf' : 'docx';
    const document = {
      case: new ObjectId(caseId),
      uploadedBy: req.user._id,
      fileName: req.file.originalname,
      fileUrl: `local://${Date.now()}_${req.file.originalname}`,
      fileType,
      sharedWith: sharedWith ? JSON.parse(sharedWith).map(id => new ObjectId(id)) : [],
      version: 1,
      isSigned: false,
      signedAt: null,
      aiSummary: null,
      createdAt: new Date(),
    };

    // Try Cloudinary upload
    try {
      const cloudinary = require('../config/cloudinary');
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { resource_type: 'raw', folder: 'legaldesk' },
          (err, result) => err ? reject(err) : resolve(result)
        );
        stream.end(req.file.buffer);
      });
      document.fileUrl = result.secure_url;
    } catch (e) {
      console.warn('Cloudinary unavailable, using local reference');
    }

    const result = await db.collection('documents').insertOne(document);
    document._id = result.insertedId;
    res.status(201).json(document);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Server error during upload' });
  }
});

// PUT /api/documents/:id/share
router.put('/:id/share', protect, requireRole('lawyer'), async (req, res) => {
  try {
    const db = getDB();
    const result = await db.collection('documents').findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $addToSet: { sharedWith: new ObjectId(req.body.clientId) } },
      { returnDocument: 'after' }
    );
    if (!result) return res.status(404).json({ message: 'Document not found' });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/documents/:id
router.delete('/:id', protect, requireRole('lawyer', 'admin'), async (req, res) => {
  try {
    const db = getDB();
    const result = await db.collection('documents').deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Document deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/documents/:id/sign
router.post('/:id/sign', protect, requireRole('lawyer', 'client'), async (req, res) => {
  try {
    const db = getDB();
    const result = await db.collection('documents').findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: { isSigned: true, signedAt: new Date(), signedBy: req.user._id, signatureUrl: req.body.signatureData || '' } },
      { returnDocument: 'after' }
    );
    if (!result) return res.status(404).json({ message: 'Not found' });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/documents/:id/analyze
router.post('/:id/analyze', protect, requireRole('lawyer'), async (req, res) => {
  try {
    const db = getDB();
    const doc = await db.collection('documents').findOne({ _id: new ObjectId(req.params.id) });
    if (!doc) return res.status(404).json({ message: 'Not found' });
    if (doc.aiSummary) return res.json({ summary: doc.aiSummary });

    let text = req.body.text || '';
    if (!text && doc.fileUrl && !doc.fileUrl.startsWith('local://')) {
      try {
        const axios = require('axios');
        const resp = await axios.get(doc.fileUrl, { responseType: 'arraybuffer' });
        const buf = Buffer.from(resp.data);
        if (doc.fileType === 'pdf') {
          const pdfParse = require('pdf-parse');
          text = (await pdfParse(buf)).text;
        } else {
          const mammoth = require('mammoth');
          text = (await mammoth.extractRawText({ buffer: buf })).value;
        }
      } catch (e) { text = req.body.text || 'Sample document text.'; }
    }
    if (!text) text = req.body.text || 'Sample document for analysis.';

    const summary = await analyzeDocument(text);
    await db.collection('documents').updateOne({ _id: doc._id }, { $set: { aiSummary: summary } });
    res.json({ summary });
  } catch (error) {
    console.error('AI analysis error:', error);
    res.status(500).json({ message: 'AI analysis failed: ' + error.message });
  }
});

// POST /api/documents/:id/chat
router.post('/:id/chat', protect, requireRole('lawyer'), async (req, res) => {
  try {
    const db = getDB();
    const { question, conversationHistory, documentText } = req.body;
    const doc = await db.collection('documents').findOne({ _id: new ObjectId(req.params.id) });
    if (!doc) return res.status(404).json({ message: 'Not found' });

    const docText = doc.aiSummary || documentText || 'No document text available.';
    const answer = await chatWithDocument(docText, conversationHistory || [], question);
    res.json({ answer });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ message: 'Chat failed: ' + error.message });
  }
});

module.exports = router;
