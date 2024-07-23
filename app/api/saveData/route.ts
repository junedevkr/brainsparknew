import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

const filePath = path.join(process.cwd(), 'public', 'data.json');

export async function POST(req: Request) {
  const { section, data } = await req.json();

  if (!section || !data) {
    return new NextResponse(JSON.stringify({ message: 'Invalid data' }), { status: 400 });
  }

  try {
    const fileData = fs.readFileSync(filePath, 'utf-8');
    const jsonData = JSON.parse(fileData);

    jsonData[section] = data;

    fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));

    return new NextResponse(JSON.stringify({ message: 'Data saved successfully' }), { status: 200 });
  } catch (error) {
    console.error('Error saving data:', error);
    return new NextResponse(JSON.stringify({ message: 'Error saving data' }), { status: 500 });
  }
}

export async function GET() {
  try {
    const fileData = fs.readFileSync(filePath, 'utf-8');
    const jsonData = JSON.parse(fileData);
    return new NextResponse(JSON.stringify(jsonData), { status: 200 });
  } catch (error) {
    console.error('Error reading file:', error);
    return new NextResponse(JSON.stringify({ message: 'Error reading file' }), { status: 500 });
  }
}
