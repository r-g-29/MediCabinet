const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const MedicineReference = require('../models/MedicineReference');

const BATCH_SIZE = 1000;

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Create index to ensure it's up to date
    await MedicineReference.syncIndexes();
    console.log('Indexes synced');

    let batch = [];
    const seenNames = new Set();
    let imported = 0;
    
    // Check if we already have data
    const existingCount = await MedicineReference.countDocuments();
    if (existingCount > 0) {
        console.log(`Clearing ${existingCount} existing reference records...`);
        await MedicineReference.deleteMany({});
    }

    const csvFilePath = path.join(__dirname, '../../data/A_Z_medicines_dataset_of_India.csv');
    console.log(`Reading from ${csvFilePath}`);

    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (data) => {
        let name = data.name ? data.name.trim().toLowerCase() : '';
        if (!name || seenNames.has(name)) return;
        seenNames.add(name);

        let compString = [data.short_composition1, data.short_composition2].filter(Boolean).join(' , ');
        
        // Split by +, , or and
        let ingredients = compString.split(/\+|and|,/i)
          .map(i => i.trim())
          .filter(i => i.length > 0);
        
        // Strip dosage e.g. " (500mg)", " 500mg"
        ingredients = ingredients.map(i => {
            // regex to remove dosages
            let stripped = i.replace(/\(?[0-9.]+\s*(?:mg|ml|mcg|g|iu|%|w\/v|v\/v)\)?/gi, '').trim();
            // remove trailing slashes or extra chars left behind sometimes
            stripped = stripped.replace(/\/$/, '').trim();
            return stripped.toLowerCase();
        }).filter(i => i.length > 0);

        // Deduplicate ingredients
        ingredients = [...new Set(ingredients)];

        batch.push({
          name,
          composition: ingredients,
          uses: ''
        });

        if (batch.length >= BATCH_SIZE) {
          const currentBatch = batch;
          batch = [];
          MedicineReference.insertMany(currentBatch, { ordered: false }).catch(err => {
              // Ignore duplicate key errors if any
          });
          imported += currentBatch.length;
          if (imported % 10000 === 0) console.log(`Imported ${imported}...`);
        }
      })
      .on('end', async () => {
        if (batch.length > 0) {
          await MedicineReference.insertMany(batch, { ordered: false }).catch(err => {});
          imported += batch.length;
        }
        console.log(`Import finished. Processed ${imported} unique medicines.`);
        mongoose.disconnect();
      })
      .on('error', (err) => {
        console.error(err);
        mongoose.disconnect();
      });

  } catch (error) {
    console.error('Error importing:', error);
    process.exit(1);
  }
}

run();
