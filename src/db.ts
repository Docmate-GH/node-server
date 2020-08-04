import 'reflect-metadata'
import { createConnection } from 'typeorm'
import * as path from 'path'

export function connect() {
  return createConnection()
}