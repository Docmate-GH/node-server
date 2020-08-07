import { AppReq } from "..";
import { Response } from "express";
import { createHash } from 'crypto'

interface HasuraActionBody<Input> {
  session_variables: any,
  input: Input,
  action: {
    name: string
  }
}

export async function signUpAction(req: AppReq, response: Response) {

  const { input: { input: { email, password, password_confirm } } } = req.body as HasuraActionBody<{
    input: {
      email: string,
      password: string,
      password_confirm: string
    }
  }>

  if (password !== password_confirm) {
    response.status(400)
    response.json({
      code: "400",
      message: 'Password confirm failed'
    })
    return
  }

  // find exist 
  const findExistUserResult = await req.appService.client.query<{
    users: {
      id: string
    }[]
  }>(`
    query($email: String) {
      users(
        where: {
          deleted_at: { _is_null: true },
          email: { _eq: $email }
        }
      ) {
        id
      }
    }
  `, { email }).toPromise()

  if (findExistUserResult.data) {
    if (findExistUserResult.data.users.length > 0) {
      // user exist
      response.status(400)
      response.json({
        message: 'Email exist!'
      })
    } else {
      const encryptedPassword = await req.appService.encryptPassword(password)

      const defaultUserName = email.split('@')[0]

      const createUserResult = await req.appService.client.query<{
        insert_users_one: {
          email: string,
          id: string,
        }
      }>(`
        mutation($email: String!, $password: String!, $username: String!) {
          insert_users_one(object: {
            email: $email,
            password: $password,
            username: $username
          }) {
            email, id
          }
        }
      `, {
        email,
        password: encryptedPassword,
        username: defaultUserName // use email name as username
      }).toPromise()

      if (!createUserResult.error) {

        // create team for user

        const createTeamResult = await req.appService.client.query<{
          insert_teams_one: {
            id: string
          }
        }>(`
          mutation($title: String!, $master: uuid!) {
            insert_teams_one(object: {
              master: $master,
              title: $title
            }) {
              id
            }
          }
        `, {
          title: defaultUserName,
          master: createUserResult.data?.insert_users_one.id
        }).toPromise()

        if (!createTeamResult.error) {

          // join team
          const joinTeamResult = await req.appService.client.query<{
            insert_user_team_one: {
              team_id: string, user_id: string
            }
          }>(`
            mutation($teamId: uuid!, $userId: uuid!) {
              insert_user_team_one(object: {
                team_id: $teamId,
                user_id: $userId
              }) {
                user_id, team_id
              }
            }
          `, {
            teamId: createTeamResult.data?.insert_teams_one.id,
            userId: createUserResult.data?.insert_users_one.id
          }).toPromise()

          if (!joinTeamResult.error) {
            response.json({
              id: createUserResult.data!.insert_users_one.id
            })
          } else {
            // TODO: join team error
          }
        } else {
          // TODO: create team error
          console.log(createTeamResult.error)
        }

      } else {
        console.log(createUserResult.error)
        response.status(400)
        // TODO: create user error
        response.json({
          message: 'Unknown error'
        })
      }

    }
  }

}



export async function signinAction(req: AppReq, response: Response) {
  const { input: { input: { email, password } } } = req.body as HasuraActionBody<{
    input: {
      email: string,
      password: string
    }
  }>

  const findUserByEmailResult = await req.appService.client.query<{
    users: {
      id: string,
      password: string,
      username: string,
      email: string
    }[]
  }>(`
    query($email: String!) {
      users(
        where: {
          email: { _eq: $email },
          deleted_at: { _is_null: true }
        }
      ) {
        id, password, username, email
      }
    }
  `, {
    email
  }).toPromise()

  if (!findUserByEmailResult.error) {
    if (findUserByEmailResult.data!.users.length > 0) {
      const user = findUserByEmailResult.data!.users[0]
      if (await req.appService.comparePassword(password, user.password)) {

        response.json({
          token: req.appService.getJWT({
            name: user.username
          }, {
            'x-hasura-user-id': user.id,
            'x-hasura-default-role': "user",
          }),
          id: user.id,
          username: user.username,
          email: user.email,
          avatar: createHash('md5').update(user.email.toLowerCase()).digest('hex')
        })
      } else {
        // password not correct
        response.status(400)
        response.json({
          code: '400',
          message: 'password not correct'
        })
      }

    } else {
      // TODO: user not exist
      response.status(404)
      response.json({
        code: '404',
        message: 'Email not exist'
      })
    }
  } else {
    // TODO: find user error
    console.log(findUserByEmailResult.error)
    response.status(400)
    response.json({
      code: '400',
      message: 'Unknown error'
    })
  }
}