import Database from 'better-sqlite3';

const db: Database.Database = new Database(':memory:');

export default db;