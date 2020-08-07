import { Client } from '@urql/core'
import * as bcrypt from 'bcrypt'

import * as jwt from 'jsonwebtoken'

export default class AppService {

  constructor(public client: Client) {
  }

  async encryptPassword(psw: string) {
    const saltRounds = 10
    return await bcrypt.hash(psw, saltRounds) as string
  }

  async comparePassword(psw: string, hash: string) {
    const matched = await bcrypt.compare(psw, hash)
    console.log('comparing', psw, hash, matched)
    return matched
  }


  getJWT(body, claims) {
    const privateKey = `6&#X6((t>:^v>CM3g5NYfY63Z4=KN4Hx`

    const token = jwt.sign({
      ...body,
      'https://hasura.io/jwt/claims': {
        'x-hasura-allowed-roles': ['user'],
        ...claims
      },
    }, privateKey)

    return token
  }
}