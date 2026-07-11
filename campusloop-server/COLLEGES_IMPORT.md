# Indian Colleges Import & Scaling Strategy

This guide outlines the seed strategy, national import procedures, and database designs to scale the college selection system for millions of Indian students.

---

## 1. Baseline Seeding & MongoDB Refuse Warning

The seeder script has been implemented in:
👉 [seedColleges.js](file:///Users/pradeeph/Documents/campus%20loop/campusloop-server/src/scripts/seedColleges.js)

To run it, execute:
```bash
node src/scripts/seedColleges.js
```

> [!WARNING]
> **MongoDB Refuse Connection**: If the script yields an `ECONNREFUSED` error, please ensure your local MongoDB daemon is active (`brew services start mongodb-community` or checking DBngin status), or update the `MONGODB_URI` inside your `.env` file to point to a valid MongoDB Atlas cluster.

---

## 2. National AISHE Dataset Import Strategy

India has over 45,000 colleges registered under the **All India Survey on Higher Education (AISHE)**. To seed this national dataset:

### A. Download the Dataset
You can download public college datasets directly from:
1. [Data.gov.in](https://data.gov.in/) (Search for "AISHE Directory of Colleges").
2. Standard open repositories hosting pre-cleaned JSON listings of AISHE colleges.

### B. High-Performance Bulk Import Script
When importing 45,000+ records, traditional loop-based `save()` calls trigger thousands of round-trips. Instead, use the **bulk insert strategy** with `insertMany`.

Create a file `src/scripts/importAllColleges.js` with the following batching logic:

```javascript
require('dotenv').config();
const fs = require('fs');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const College = require('../models/College');

const importData = async () => {
  try {
    await connectDB();
    
    // Read the dataset
    const rawData = fs.readFileSync('./dataset/aishe_colleges.json', 'utf-8');
    const records = JSON.parse(rawData);
    
    console.log(`Loaded ${records.length} records. Processing...`);

    // Clean and transform data to match College schema
    const collegesToInsert = records.map(item => ({
      name: item.college_name,
      shortName: item.acronym || '',
      state: item.state_name,
      district: item.district_name,
      city: item.city || '',
      university: item.university_name || '',
      emailDomain: item.domain || '',
      type: item.type || 'other'
    }));

    console.log('Clearing existing collection...');
    await College.deleteMany({});

    // Bulk insert in batches of 5000 for high speed and memory control
    const BATCH_SIZE = 5000;
    for (let i = 0; i < collegesToInsert.length; i += BATCH_SIZE) {
      const batch = collegesToInsert.slice(i, i + BATCH_SIZE);
      await College.insertMany(batch);
      console.log(`Imported ${i + batch.length}/${collegesToInsert.length}...`);
    }

    console.log('🎉 National Import Completed Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
};

importData();
```

---

## 3. Database Scaling for Millions of Students

To guarantee fast query times (<50ms) as the platform scales:

### A. Compound Indexing
Cascading queries filter by state, then district. We created a compound index on these fields:
```javascript
collegeSchema.index({ state: 1, district: 1 });
```
This enables Mongoose to resolve `state` and `district` lookups with simple index scans.

### B. Snappy Autocomplete search
For autocomplete queries, searching through 45k+ colleges with simple regex searches can cause CPU spikes. We added text indexes:
```javascript
collegeSchema.index({ name: 'text', shortName: 'text' });
```
In production, you can utilize MongoDB Atlas Search (Lucene-backed fuzzy matching) for instant spelling-tolerant search.

### C. Server-Side Pagination
AutoComplete lists restrict search results with `limit(30)` to optimize network packet size.

---

## 4. Fallback Strategy if College is Missing

To ensure students are never blocked during registration:
1. **Add Your College Overlay**: An option appears when search yields empty results.
2. **Dynamic Entry Creation**: Submitting the form saves the college directly to the database via `POST /api/v1/colleges`, making it instantly selectable for subsequent sign-ups from the same campus.
3. **Auto Email Domain Pre-fill**: The script infers the email domain from the student's registration email (e.g. `@iitb.ac.in` -> `iitb.ac.in`), which auto-associates verification boundaries for future users.
