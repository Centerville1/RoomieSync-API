const { DataSource } = require('typeorm');

module.exports = new DataSource({
  type: 'postgres',
  ...(process.env.DATABASE_URL 
    ? { url: process.env.DATABASE_URL }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT, 10) || 5433,
        username: process.env.DB_USERNAME || 'roomiesync',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_NAME || 'roomiesync_db',
      }
  ),
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/migrations/*.js'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});