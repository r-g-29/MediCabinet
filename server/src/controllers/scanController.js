const { runOCR } = require('../services/ocrService');
const { parseScan } = require('../services/parserService');

const scanMedicine = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No images provided' });
    }

    const buffers = req.files.map(f => f.buffer);
    
    // 1. Run OCR
    const rawText = await runOCR(buffers);
    
    if (!rawText) {
      return res.status(422).json({ success: false, message: 'Could not extract text from images' });
    }

    // 2. Parse text
    const parsedData = await parseScan(rawText);

    res.json({ success: true, data: parsedData });
  } catch (err) {
    next(err);
  }
};

module.exports = { scanMedicine };
