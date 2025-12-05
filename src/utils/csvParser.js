// utils/csvParser.js

const fs = require('fs');
const csv = require('csv-parser');

/**
 * Parses a CSV file and returns an array of lead objects.
 * Assumes the CSV has 'name', 'phone', and 'interest' columns.
 */
exports.parseCsv = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        const leadData = {
          name: data.name?.trim() || 'Unknown Lead',
          // Clean phone number: + signs allow for international format
          phone: data.phone?.trim().replace(/[^0-9+]/g, '') || null, 
          interest: data.interest?.trim() || 'General Inquiry'
        };
        
        // Basic validation: must have a phone number > 9 digits
        if (leadData.phone && leadData.phone.replace('+', '').length >= 10) {
            results.push(leadData);
        } else {
            // Log for debugging
            console.warn(`Skipping lead due to invalid phone number: ${data.phone} for ${leadData.name}`);
        }
      })
      .on('end', () => {
        resolve(results);
      })
      .on('error', (err) => {
        reject(err);
      });
  });
};