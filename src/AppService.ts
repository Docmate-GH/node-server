import { Client } from '@urql/core'
import * as bcrypt from 'bcrypt'

export default class AppService {

  constructor(public client: Client) {
  }

  async encryptPassword (psw: string) {
    const saltRounds = 10
    return await bcrypt.hash(psw, saltRounds) as string
  }

}