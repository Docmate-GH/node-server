import { Client } from '@urql/core'
import * as bcrypt from 'bcrypt'

import * as jwt from 'jsonwebtoken'
import { isUserVerifyEnabled } from './utils'
import { logError } from './logger'
import { createHash } from 'crypto'

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
    const hash = createHash('md5').update(email.toLowerCase()).digest('hex')
    return `//www.gravatar.com/avatar/${hash}?d=identicon`
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

  async createUser(email: string, password: string, events: {
    onExist: (user: {
      id: string,
      email: string,
      avatar: string,
      username: string,
      auth_service: string
    }) => void,
    onCreateSuccess: (user: {
      avatar: string,
      id: string,
      username: string,
      email: string,
    }) => void,
    onFailed: (err: any) => void
  }, options?: {
    username?: string,
    auth_service?: string
  }) {
    // find exist 
    const findExistUserResult = await this.client.query<{
      users: {
        id: string,
        email: string,
        username: string,
        avatar: string,
        auth_service: string
      }[]
    }>(`
      query($email: String) {
        users(
          where: {
            deleted_at: { _is_null: true },
            email: { _eq: $email }
          }
        ) {
          id, email, username, avatar, auth_service
        }
      }
    `, { email }).toPromise()

    if (findExistUserResult.data) {
      if (findExistUserResult.data.users.length > 0) {
        events.onExist(findExistUserResult.data.users[0])
      } else {
        const encryptedPassword = await this.encryptPassword(password)

        const defaultUserName = options?.username || email.split('@')[0]

        const createUserResult = await this.client.query<{
          insert_users_one: {
            email: string,
            id: string,
            username: string,
            avatar: string
          }
        }>(`
          mutation($email: String!, $password: String!, $username: String!, $verified: Boolean!, $avatar: String, $authService: String) {
            insert_users_one(object: {
              email: $email,
              password: $password,
              username: $username,
              verified: $verified,
              avatar: $avatar,
              auth_service: $authService
            }) {
              email, id, username, avatar
            }
          }
        `, {
          verified: isUserVerifyEnabled ? false : true,
          email,
          authService: options?.auth_service,
          avatar: this.createGravatar(email),
          password: encryptedPassword,
          username: defaultUserName // use email name as username
        }).toPromise()

        if (!createUserResult.error) {

          // create team for user

          const createTeamResult = await this.createTeam(defaultUserName, createUserResult.data!.insert_users_one.id, true)

          if (!createTeamResult.error) {

            // join team
            const joinTeamResult = await this.joinTeam(createTeamResult.data!.insert_teams_one.id, createUserResult.data!.insert_users_one.id)

            if (!joinTeamResult.error) {
              const user = createUserResult.data!.insert_users_one
              // success
              events.onCreateSuccess({
                avatar: user.avatar,
                id: user.id,
                username: user.username,
                email: user.email
              })
            } else {
              events.onFailed(joinTeamResult.error)
            }
          } else {
            events.onFailed(createTeamResult.error)
          }

        } else {
          events.onFailed(createUserResult.error)
        }
      }
    }
  }
}