const path = require('path');
const { createWorker } = require('tesseract.js');

const runOCR = async (imageBuffers) => {
  let combinedText = '';
  // Use local eng.traineddata in server directory
  const langPath = path.resolve(__dirname, '../../');

  for (const buffer of imageBuffers) {
    try {
      const worker = await createWorker('eng', 1, {
        langPath,
        gzip: false,
      });
      const result = await worker.recognize(buffer);
      await worker.terminate();
      if (result && result.data && result.data.text) {
        combinedText += result.data.text + '\n\n';
      }
    } catch (err) {
      console.error('OCR Error on image buffer:', err);
    }
  }
  
  return combinedText.trim();
};

module.exports = { runOCR };

