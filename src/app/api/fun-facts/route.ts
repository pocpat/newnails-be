import { NextResponse } from 'next/server';
import { withCors } from '@/lib/cors';
import fs from 'fs';
import path from 'path';

// Cache the facts in memory after first load
let cachedFacts: string[] = [];

function getFunFacts(): string[] {
  if (cachedFacts.length > 0) return cachedFacts;

  try {
    const filePath = path.join(process.cwd(), 'scripts', 'fun.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    cachedFacts = (data.humor || []).map((f: { text: string }) => f.text);
    return cachedFacts;
  } catch (error) {
    console.error('Error reading fun facts file:', error);
    return [];
  }
}

async function handler() {
  const facts = getFunFacts();

  if (facts.length === 0) {
    return NextResponse.json(
      { error: 'No fun facts found.' },
      { status: 404 }
    );
  }

  const random = Math.floor(Math.random() * facts.length);
  return NextResponse.json({ text: facts[random] });
}

export const GET = withCors(handler as never);