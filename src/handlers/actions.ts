import { AppReq } from "..";
import { Response } from "express";
import { createHash } from 'crypto'
import AppService from "../AppService";
import { v4 as uuid } from 'uuid'
import { logError } from "../logger";

interface HasuraActionBody<Input> {
  session_variables: {
    'x-hasura-user-id': string
  },
  input: Input,
  action: {
    name: string
  }
}

export async function signUpAction(req: AppReq, response: Response) {

  const { input: { input: { email, password, password_confirm } }, session_variables } = req.body as HasuraActionBody<{
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

        const createTeamResult = await req.appService.createTeam(defaultUserName, createUserResult.data!.insert_users_one.id, true)

        if (!createTeamResult.error) {

          // join team
          const joinTeamResult = await req.appService.joinTeam(createTeamResult.data!.insert_teams_one.id, createUserResult.data!.insert_users_one.id)

          if (!joinTeamResult.error) {
            response.json({
              id: createUserResult.data!.insert_users_one.id
            })
          } else {
            logError(joinTeamResult.error, session_variables["x-hasura-user-id"])
          }
        } else {
          logError(createTeamResult.error, session_variables["x-hasura-user-id"])
        }

      } else {
        response.status(400)
        logError(createUserResult.error, session_variables["x-hasura-user-id"])
        response.json({
          message: 'Unknown error'
        })
      }

    }
  }

}



export async function signinAction(req: AppReq, response: Response) {
  const { input: { input: { email, password } }, session_variables } = req.body as HasuraActionBody<{
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
          message: 'Password not correct'
        })
      }

    } else {
      response.status(404)
      response.json({
        code: '404',
        message: 'Email not exist'
      })
    }
  } else {
    logError(findUserByEmailResult.error, session_variables["x-hasura-user-id"])
    response.status(400)
    response.json({
      code: '400',
      message: 'Unknown error'
    })
  }
}

export async function createTeam(req: AppReq, response: Response) {
  const { input: { input: { title } }, session_variables } = req.body as HasuraActionBody<{
    input: {
      title: string
    }
  }>

  const createTeamResult = await req.appService.createTeam(title, session_variables['x-hasura-user-id'])

  if (!createTeamResult.error) {
    const teamId = createTeamResult.data!.insert_teams_one.id

    // join team
    const joinTeamResult = await req.appService.joinTeam(teamId, session_variables["x-hasura-user-id"])

    if (!joinTeamResult.error) {
      response.json({
        teamId: joinTeamResult.data!.insert_user_team_one.team_id
      })
    } else {
      logError(joinTeamResult.error, session_variables["x-hasura-user-id"])
      response.status(400)
      response.json({
        message: 'join team error'
      })
    }

  } else {
    logError(createTeamResult.error, session_variables["x-hasura-user-id"])
    response.status(400)
    response.json({
      message: 'create team error'
    })
  }
}

export async function joinTeam(req: AppReq, response: Response) {
  const { input: { inviteId }, session_variables } = req.body as HasuraActionBody<{
    inviteId: string
  }>

  const findTeamByInviteId = await req.appService.client.query<{
    teams: {
      id: string
    }[]
  }>(`
    query($inviteId: uuid!) {
      teams(where:{
        invite_id: { _eq: $inviteId},
        deleted_at: { _is_null: true }
      }) {
        id
      }
    }
  `, {
    inviteId
  }).toPromise()

  if (findTeamByInviteId.error) {
    logError(findTeamByInviteId.error, session_variables["x-hasura-user-id"])

    response.status(400)
    response.json({
      message: 'find team error'
    })
    return
  }

  if (findTeamByInviteId.data!.teams.length > 0) {
    const team = findTeamByInviteId.data!.teams[0]

    const joinTeamResult = await req.appService.client.mutation(`
      mutation($teamId: uuid!, $userId: uuid!) {
        insert_user_team_one(object:{
          user_id: $userId,
          team_id: $teamId
        }) {
          user_id
        }
      }
    `, {
      teamId: team.id,
      userId: session_variables["x-hasura-user-id"]
    }).toPromise()

    if (joinTeamResult.error) {
      logError(joinTeamResult.error, session_variables["x-hasura-user-id"])
      response.status(400)
      response.json({
        message: 'join team error'
      })
    } else {
      response.json({
        success: true,
        teamId: team.id
      })
    }

  } else {
    response.status(400)
    response.json({
      success: false,
      message: 'Invalid invite link'
    })
  }
}

export async function revokeInviteId(req: AppReq, response: Response) {
  const { session_variables, input: { teamId } } = req.body as HasuraActionBody<{
    teamId: string
  }>

  const getTeamResult = await req.appService.client.query<{
    teams_by_pk: {
      master: string
    }
  }>(`
    query($teamId: uuid!) {
      teams_by_pk(id: $teamId) {
        master
      }
    }
  `, { teamId }).toPromise()


  if (getTeamResult.data) {
    if (getTeamResult.data.teams_by_pk.master === session_variables["x-hasura-user-id"]) {
      const newId = uuid()

      const updateResult = await req.appService.client.mutation<{
        update_teams_by_pk: {
          invite_id: string
        }
      }>(`
        mutation($teamId: uuid!, $inviteId: uuid!) {
          update_teams_by_pk(pk_columns: {
            id: $teamId
          }, _set:{
            invite_id: $inviteId
          }) {
            invite_id
          }
        }
      `, {
        teamId,
        inviteId: newId
      }).toPromise()

      if (!updateResult.error) {
        response.json({
          code: updateResult.data!.update_teams_by_pk.invite_id
        })
      } else {
        logError(updateResult.error, session_variables["x-hasura-user-id"])
        response.status(400)
        response.json({
          message: 'Update errror'
        })
      }
    } else {
      response.status(403)
      response.json({
        message: 'No permission'
      })
    }
  } else {
    logError(getTeamResult.error, session_variables["x-hasura-user-id"])

    response.status(400)
    response.json({

    })
  }
}