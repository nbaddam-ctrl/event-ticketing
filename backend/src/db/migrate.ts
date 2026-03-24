import fs from 'node:fs';
import path from 'node:path';
import { db } from './client.js';

const schemaPath = path.resolve(process.cwd(), 'src/db/schema.sql');
const sql = fs.readFileSync(schemaPath, 'utf8');

db.exec(sql);

console.log('Database schema applied');
