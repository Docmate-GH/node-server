import { AppReq } from ".."
import { Response, CookieOptions } from "express"
import { isUserVerifyEnabled } from "../utils"
import { logError } from "../logger"

const generateCookiesAndSendResult = (req: AppReq, response: Response, {
  user
}: {
  user: {
    username: string,
    id: string,
    email: string,
    avatar: string
  }
}) => {
  // success
  const hasuraJWT = req.appService.getHasuraJWT({
    name: user.username
  }, {
    'x-hasura-user-id': user.id,
    'x-hasura-default-role': "user",
  })
  const jwtForDoc = req.appService.genJWT({
    userId: user.id
  })
  response.cookie('__DOCMATE__TOKEN__', hasuraJWT, {
    maxAge: 3600000 * 24 * 7,
  })

  const DOC_TOKEN = {
    maxAge: 3600000 * 24 * 7,
  } as CookieOptions
  if (process.env.DOC_COOKIES_DOMAIN) {
    // TODO: should not hard code
    DOC_TOKEN.domain = process.env.DOC_COOKIES_DOMAIN
  }
  response.cookie('__DOCMATE__DOC_TOKEN__', jwtForDoc, DOC_TOKEN)

  response.json({
    message: 'success',
    id: user.id,
    username: user.username,
    email: user.email,
    avatar: user.avatar
  })
}

export async function signUp(req: AppReq, response: Response) {

  const { email, password, password_confirm } = req.body as {
    email: string,
    password: string,
    password_confirm: string
  }

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
          username: string,
          avatar: string
        }
      }>(`
        mutation($email: String!, $password: String!, $username: String!, $verified: Boolean!, $avatar: String) {
          insert_users_one(object: {
            email: $email,
            password: $password,
            username: $username,
            verified: $verified,
            avatar: $avatar
          }) {
            email, id, username, avatar
          }
        }
      `, {
        verified: isUserVerifyEnabled ? false : true,
        email,
        avatar: req.appService.createGravatar(email),
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
            const user = createUserResult.data!.insert_users_one
            // success
            generateCookiesAndSendResult(req, response, {
              user: {
                avatar: user.avatar,
                id: user.id,
                username: user.username,
                email: user.email
              }
            })
          } else {
            logError(joinTeamResult.error, 'signUp')
          }
        } else {
          logError(createTeamResult.error, 'signUp')
        }

      } else {
        response.status(400)
        logError(createUserResult.error, 'signUp')
        response.json({
          message: 'Unknown error'
        })
      }

    }
  }

}


export async function signIn(req: AppReq, response: Response) {

  const { email, password } = req.body as {
    email: string,
    password: string
  }

  const findUserByEmailResult = await req.appService.client.query<{
    users: {
      id: string,
      password: string,
      username: string,
      email: string,
      avatar: string
    }[]
  }>(`
    query($email: String!) {
      users(
        where: {
          email: { _eq: $email },
          deleted_at: { _is_null: true }
        }
      ) {
        id, password, username, email, avatar
      }
    }
  `, {
    email
  }).toPromise()

  if (!findUserByEmailResult.error) {
    if (findUserByEmailResult.data!.users.length > 0) {
      const user = findUserByEmailResult.data!.users[0]
      if (await req.appService.comparePassword(password, user.password)) {
        // success
        generateCookiesAndSendResult(req, response, {
          user: {
            avatar: user.avatar,
            id: user.id,
            username: user.username,
            email: user.email
          }
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
    logError(findUserByEmailResult.error, 'signIn')
    response.status(400)
    response.json({
      code: '400',
      message: 'Unknown error'
    })
  }
}

export async function signOut(req: AppReq, response: Response) {
  const DOC_TOKEN = {} as CookieOptions
  if (process.env.SUBDOMAIN_DOC) {
    // TODO: should not hard code
    DOC_TOKEN.domain = 'docmate.io'
  }
  response.clearCookie('__DOCMATE__TOKEN__')
  response.clearCookie('__DOCMATE__DOC_TOKEN__')

  response.json({
    message: 'success'
  })
}