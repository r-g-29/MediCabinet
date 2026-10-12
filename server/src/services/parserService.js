const Fuse = require('fuse.js');
const MedicineReference = require('../models/MedicineReference');

const STOPWORDS = new Set([
  'each', 'film', 'coated', 'tablet', 'tablets', 'capsule', 'capsules',
  'contains', 'mg', 'ml', 'mcg', 'dosage', 'directed', 'physician',
  'keep', 'reach', 'children', 'store', 'cool', 'dry', 'place',
  'protect', 'light', 'moisture', 'mfg', 'lic', 'no', 'batch',
  'exp', 'date', 'mrp', 'incl', 'all', 'taxes', 'manufactured',
  'india', 'by', 'for', 'pharmaceuticals', 'pharma', 'ltd', 'pvt',
  'limited', 'warning', 'schedule', 'prescription', 'drug', 'caution',
  'not', 'to', 'be', 'sold', 'retail', 'without', 'oral', 'use', 'only',
  'strip', 'pack', 'ip', 'bp', 'usp'
]);

const parseDateToLastDayOfMonth = (dateStr) => {
  let month, year;
  
  // Match MM/YY, MM/YYYY, MM-YY, MM.YYYY
  const mmyyMatch = dateStr.match(/(0[1-9]|1[0-2])[\/\-\.](\d{4}|\d{2})/);
  if (mmyyMatch) {
    month = parseInt(mmyyMatch[1], 10);
    year = mmyyMatch[2].length === 2 ? 2000 + parseInt(mmyyMatch[2], 10) : parseInt(mmyyMatch[2], 10);
  } else {
    // Match YYYY/MM, YYYY-MM
    const yymmMatch = dateStr.match(/(20\d{2})[\/\-\.](0[1-9]|1[0-2])/);
    if (yymmMatch) {
      year = parseInt(yymmMatch[1], 10);
      month = parseInt(yymmMatch[2], 10);
    } else {
      const months = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
      const words = dateStr.toLowerCase().split(/[\s,\-\.]+/);
      for (const w of words) {
        const mon = Object.keys(months).find(m => w.startsWith(m));
        if (mon) month = months[mon];
        if (w.match(/^20\d{2}$/)) year = parseInt(w, 10);
        else if (w.match(/^\d{2}$/) && parseInt(w, 10) >= 20 && parseInt(w, 10) <= 50) year = 2000 + parseInt(w, 10);
      }
    }
  }

  if (!month || !year) return null;
  return new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
};

const extractExpiry = (text) => {
  const matches = [];
  // Supports slashes, hyphens, and dots
  const dateRegex = /(?:0[1-9]|1[0-2])[\/\-\.](?:20\d{2}|\d{2})|(?:20\d{2})[\/\-\.](?:0[1-9]|1[0-2])|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s,\-\.\/]+(?:20\d{2}|\d{2})/gi;
  
  let match;
  while ((match = dateRegex.exec(text)) !== null) {
    matches.push({ val: match[0], index: match.index });
  }

  if (matches.length === 0) return null;

  const keywordRegex = /exp(?:iry|ired|\.|\s*d[te]\.?|\s*date)?[\s\.\:]*/gi;
  let kwMatch;
  const expKeywords = [];
  while ((kwMatch = keywordRegex.exec(text)) !== null) {
    expKeywords.push(kwMatch.index);
  }

  const mfgRegex = /(?:mfg|mfd|pkd|packed|manufactured)[\s\.\:]*/gi;
  let mfgKw;
  const mfgKeywords = [];
  while ((mfgKw = mfgRegex.exec(text)) !== null) {
    mfgKeywords.push(mfgKw.index);
  }

  // Filter out matches that directly follow a manufacturing keyword
  const validMatches = matches.filter(m => {
    return !mfgKeywords.some(k => m.index > k && m.index - k < 40);
  });

  const candidatesToConsider = validMatches.length > 0 ? validMatches : matches;

  let bestDateStr = candidatesToConsider[0].val;
  if (expKeywords.length > 0) {
    let minDistance = Infinity;
    for (const m of candidatesToConsider) {
      for (const k of expKeywords) {
        // Expiry keyword should ideally appear just before the date
        const dist = m.index >= k ? (m.index - k) : Math.abs(m.index - k) * 2;
        if (dist < minDistance && dist < 120) {
          minDistance = dist;
          bestDateStr = m.val;
        }
      }
    }
  } else {
    // Pick the latest reasonable date (expiry is future, mfg is past)
    let latest = parseDateToLastDayOfMonth(candidatesToConsider[0].val);
    for (const m of candidatesToConsider) {
      const d = parseDateToLastDayOfMonth(m.val);
      if (d && (!latest || d > latest)) {
        latest = d;
        bestDateStr = m.val;
      }
    }
  }

  try {
    return parseDateToLastDayOfMonth(bestDateStr);
  } catch (e) {
    return null;
  }
};

const extractBatch = (text) => {
  const batchRegex = /(?:b\.?\s*no\.?|batch(?:\s*no\.?)?|lot(?:\s*no\.?)?|b\.?\s*n\.?|bn)[\s\:\.\-]*([A-Z0-9\-\/]{3,15})/i;
  const match = text.match(batchRegex);
  return match ? match[1].toUpperCase() : null;
};

const extractDosage = (text) => {
  const match = text.match(/\b(\d+(?:\.\d+)?\s*(?:mg|mcg|ml|gm?|iu))\b/i);
  return match ? match[1] : null;
};

const extractForm = (text) => {
  const match = text.match(/\b(tablets?|capsules?|syrup|suspension|drops|ointment|cream|gel|injection|inhaler)\b/i);
  return match ? match[1] : null;
};

const extractFallbackName = (text) => {
  const lines = text.split('\n')
    .map(l => l.trim())
    .filter(l => l.length >= 3 && !l.match(/^\d+$/));

  for (const line of lines) {
    const words = line.split(/\s+/).filter(w => !STOPWORDS.has(w.toLowerCase().replace(/[^a-z]/g, '')));
    if (words.length > 0) {
      const candidate = words.slice(0, 3).join(' ');
      if (candidate.length >= 3) {
        return candidate;
      }
    }
  }
  return '';
};

const findMedicineCandidates = async (text) => {
  // Extract clean keywords with min length 3
  const rawWords = text.toLowerCase().match(/[a-z0-9\-]{3,}/g) || [];
  const cleanWords = [...new Set(
    rawWords.filter(w => !STOPWORDS.has(w) && !w.match(/^\d+$/) && w.length >= 3)
  )];

  if (cleanWords.length === 0) return [];

  let candidates = [];

  // 1. First attempt full text index query
  try {
    const textQuery = cleanWords.slice(0, 8).join(' ');
    candidates = await MedicineReference.find(
      { $text: { $search: textQuery } },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(60)
      .lean();
  } catch (err) {
    candidates = [];
  }

  // 2. If text search returns few results, fallback to regex prefix matching on clean words
  if (!candidates || candidates.length < 5) {
    const regexQueries = cleanWords.slice(0, 5).map(w => ({
      name: new RegExp('^' + w.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i')
    }));

    if (regexQueries.length > 0) {
      const regexResults = await MedicineReference.find({ $or: regexQueries })
        .limit(60)
        .lean();
      
      const seen = new Set(candidates.map(c => c._id.toString()));
      for (const r of regexResults) {
        if (!seen.has(r._id.toString())) {
          candidates.push(r);
          seen.add(r._id.toString());
        }
      }
    }
  }

  if (candidates.length === 0) return [];

  // 3. Fuzzy rank against OCR lines using Fuse.js
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2);
  const fuse = new Fuse(candidates, { keys: ['name'], includeScore: true, threshold: 0.45 });
  
  const resultsMap = new Map();

  for (const line of lines) {
    const res = fuse.search(line);
    for (const match of res) {
      const confidence = Math.round((1 - match.score) * 100);
      const id = match.item._id.toString();
      const existing = resultsMap.get(id);

      const ingredients = Array.isArray(match.item.composition)
        ? match.item.composition
        : [match.item.composition].filter(Boolean);

      if (!existing || existing.confidence < confidence) {
        resultsMap.set(id, {
          name: match.item.name,
          genericName: ingredients.join(', ') || '',
          activeIngredients: ingredients,
          uses: match.item.uses || '',
          confidence
        });
      }
    }
  }

  const sorted = Array.from(resultsMap.values()).sort((a, b) => b.confidence - a.confidence);
  return sorted.slice(0, 3);
};

const parseScan = async (rawText) => {
  const expiryDate = extractExpiry(rawText);
  const batchNo = extractBatch(rawText);
  const dosage = extractDosage(rawText);
  const formType = extractForm(rawText);
  const candidates = await findMedicineCandidates(rawText);
  const fallbackName = extractFallbackName(rawText);

  const bestMatch = candidates.length > 0 ? candidates[0] : null;

  return {
    rawText,
    expiry: expiryDate ? expiryDate.toISOString() : null,
    batchNo,
    dosage,
    formType,
    detectedName: bestMatch ? bestMatch.name : fallbackName,
    detectedIngredients: bestMatch ? bestMatch.activeIngredients.join(', ') : '',
    detectedUses: bestMatch ? bestMatch.uses : '',
    candidates
  };
};

module.exports = { parseScan };

