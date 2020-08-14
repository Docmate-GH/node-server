import { Client } from '@urql/core'
import * as bcrypt from 'bcrypt'

import * as jwt from 'jsonwebtoken'

export default class AppService {

  constructor(public client: Client) {
  }

  jwtPrivateKey = (JSON.parse(process.env.DOCMATE_JWT_SECRET!)).key

  async encryptPassword(psw: string) {
    const saltRounds = 10
    return await bcrypt.hash(psw, saltRounds) as string
  }

  async comparePassword(psw: string, hash: string) {
    const matched = await bcrypt.compare(psw, hash)
    return matched
  }

  createGravatar(email: string = '986699d2682d1fad58ee732e440c6c82') {
    return `//www.gravatar.com/avatar/${email}?d=identicon`
  }


  genJWT(body) {
    return jwt.sign(body, this.jwtPrivateKey)
  }

  parseJWT(jwtString: string) {
    return jwt.verify(jwtString, this.jwtPrivateKey)
  }

  getHasuraJWT(body, claims) {
    return this.genJWT({
      ...body,
      'https://hasura.io/jwt/claims': {
        'x-hasura-allowed-roles': ['user'],
        ...claims
      },
    })
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

  getUserPlan(userId: string) {
    return this.client.query<{
      users_by_pk: {
        plan: string
      }
    }>(`
      query($userId: uuid!) {
        users_by_pk(id: $userId) {
          plan
        }
      }
    `, {
      userId
    })
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