import 'reflect-metadata'
import { createConnection } from 'typeorm'
import * as path from 'path'

export function connect() {

  return createConnection({
    type: 'sqlite',
    database: path.resolve(__dirname, '../db/db.sqlite3'),
    synchronize: true,
    logging: true,
    entities: [
      path.resolve(__dirname, './models/*.js')
    ]
  })
}