
import * as path from 'path';
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
import mongoose from 'mongoose';
import FunFact from '../src/models/FunFact';
import * as fs from 'fs';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Please define the MONGODB_URI environment variable inside .env.local');
  process.exit(1);
}

const seedDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected for seeding...');

    await FunFact.deleteMany({});
    console.log('Cleared existing fun facts.');

    const funFactsPath = path.join(__dirname, 'fun.json');
    const funFactsData = JSON.parse(fs.readFileSync(funFactsPath, 'utf-8'));
    
    const factsToInsert = funFactsData.humor.map((fact: { text: string }) => ({
      text: fact.text,
    }));

    await FunFact.insertMany(factsToInsert);
    console.log('Successfully seeded fun facts.');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
  }
};

seedDB();
