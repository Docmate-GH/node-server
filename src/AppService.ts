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
    return matched
  }


  getJWT(body, claims) {
    const privateKey = (JSON.parse(process.env.DOCMATE_JWT_SECRET!)).key

    const token = jwt.sign({
      ...body,
      'https://hasura.io/jwt/claims': {
        'x-hasura-allowed-roles': ['user'],
        ...claims
      },
    }, privateKey)

    return token
  }

  createTeam(title: string, masterUserId: string, isPersonal = false) {
    return this.client.query<{
      insert_teams_one: {
        id: string
      }
    }>(`
      mutation($title: String!, $master: uuid!, $isPersonal: Boolean) {
        insert_teams_one(object: {
          master: $master,
          title: $title,
          is_personal: $isPersonal
        }) {
          id
        }
      }
    `, {
      title,
      master: masterUserId,
      isPersonal
    }).toPromise()
  }

  joinTeam(teamId: string, userId: string) {
    return this.client.mutation<{
      insert_user_team_one: {
        team_id: string, user_id: string
      }
    }>(`
      mutation($teamId:uuid!, $userId:uuid!) {
        insert_user_team_one(object:{
          team_id:$teamId,
          user_id:$userId
        }) {
          team_id, user_id
        }
      }
  `, {
    teamId,
    userId
  }).toPromise()
  }
}