const path = require('path')

// module.exports = {
//   type: 'sqlite',
//   database: path.resolve(__dirname, './db/db.sqlite3'),
//   synchronize: false,
//   logging: true,
//   entities: [
//     path.resolve(__dirname, './lib/models/*.js')
//   ],
//   migrations: ["./lib/migration/*.js"],
//   cli: {
//     migrationsDir: "./src/migration"
//   }
// }

module.exports = {
  type: 'mysql',
  database: 'docpera_dev',
  port: 3306,
  username: 'root',
  password: 'password',
  synchronize: true,
  logging: true,
  entities: [
    path.resolve(__dirname, './lib/models/*.js')
  ],
  migrations: ["./lib/migration/*.js"],
  cli: {
    migrationsDir: "./src/migration"
  }
}