import { AppReq } from "..";
import { Response } from "express";
import axios from 'axios'
import * as qs from 'querystring'
import { logError } from "../logger";
import { v4 as uuid } from 'uuid'
import { generateCookiesAndSendResult } from "./sign";

export const github = async (req: AppReq, response: Response) => {
  const { code } = req.query

  try {
    const result = await axios.post<string>('https://github.com/login/oauth/access_token', {
      client_id: process.env.GH_CLIENT_ID,
      client_secret: process.env.GH_CLIENT_SECRET,
      code,
    })

    const { access_token } = qs.decode(result.data) as {
      access_token: string
    }

    const getUserEmail = await axios.get<{
      email: string,
      primary: boolean,
      verified: boolean
    }[]>(`https://api.github.com/user/public_emails`, {
      headers: {
        accept: 'application/vnd.github.v3+json',
        Authorization: `token ${access_token}`
      }
    })

    const emailData = getUserEmail.data.find(e => e.primary === true && e.verified === true)

    if (emailData) {
      await req.appService.createUser(emailData.email, uuid(), {
        onExist(user) {

          if (user.auth_service !== 'github') {
            response.status(501)
            response.json({
              message: `You had signed with another service: ${user.auth_service}`
            })
            return
          }

          generateCookiesAndSendResult(req, response, {
            user: {
              avatar: user.avatar,
              email: user.email,
              id: user.id,
              username: user.username
            }
          }, false)
          response.redirect('/')
        },
        onFailed(err) {
          logError(err, 'sign in with Github')
          response.status(500)
          response.json({
            message: 'Sign in failed'
          })
        },
        onCreateSuccess(user) {
          generateCookiesAndSendResult(req, response, {
            user: {
              avatar: user.avatar,
              email: user.email,
              id: user.id,
              username: user.username
            }
          }, false)
          response.redirect('/')
        }
      }, {
        auth_service: 'github'
      })
    } else {
      throw new Error('No usable Github email')
    }

  } catch (e) {
    logError(e, 'Sign in failed')
    response.json({
      message: 'Sign in failed'
    })
  }
}