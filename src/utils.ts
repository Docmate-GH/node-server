import * as path from 'path'
import * as multer from 'multer'
import { AppReq } from '.'
import { ReadStream } from 'fs'
import * as AliOSS from 'ali-oss'
import { v4 as uuid } from 'uuid'
export const isProEnabled = process.env.ENABLE_PRO === 'true'
export const imagePath = process.env.IMAGES_PATH || path.resolve(__dirname, '../images')

export const useOSS = process.env.OSS_TYPE === 'aliyun'

import * as MAO from 'multer-aliyun-oss'
import { logError } from './logger'
import { Response } from 'express'

export const isUserVerifyEnabled = process.env.ENABLE_USER_VERIFY === 'true'

const diskStorage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, imagePath)
  },
  filename(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix)
  }
})


type GetDestination = (req: AppReq, file: ReadStream, cb: (err: null | any, destination: string) => void) => void

class AliOSSStorage {

  static make = (opts) => {
    return new AliOSSStorage(opts)
  }

  client

  constructor(opts: {
    getDestination: GetDestination,
    getFilename: any
    oss: {
      region: string,
      accessKeyId: string,
      accessKeySecret: string,
      bucket: string
    }
  }) {
    this.client = new AliOSS(opts.oss)
  }

  async _handleFile(req, file: {
    fieldname: string,
    originalname: string,
    mimetype: string,
    stream
  }, cb) {
    const destination = process.env.ALI_OSS_PATH || '/images'

    try {
      const filename = uuid()
      const ossName = `${destination}/${filename}`

      const putResult = await this.client.putStream(ossName, file.stream, {
        mime: file.mimetype
      }) as {
        name: string,
        url: string,
        size: number
      }

      cb(null, { ossURL: putResult.url, cdnURL: process.env.ALI_OSS_CDN ? this.client.getObjectUrl(ossName, process.env.ALI_OSS_CDN) : putResult.url, path: ossName, size: putResult.size, name: putResult.name })
    } catch (e) {
      logError(e, 'unknow')
    }
  }

  _removeFile(req, file, cb) {
    console.log('remove')
  }
}

export const uploadMiddleware = multer({

  storage: useOSS ? AliOSSStorage.make({
    oss: {
      region: process.env.ALI_OSS_REGION!,
      bucket: process.env.ALI_OSS_BUCKET!,
      accessKeyId: process.env.ALI_OSS_ID!,
      accessKeySecret: process.env.ALI_OSS_SECRET!
    }
  }) : diskStorage
})

export const proPlanGuard = async (req: AppReq, res: Response, next) => {
  if (!isProEnabled) {
    next()
  } else {
    let jwt = req.headers['authorization']

    if (!jwt) {
      res.status(403)
      res.json({
        message: 'No permission'
      })
    } else {
      jwt = jwt.replace('Bearer ', '')
      const parsed = req.appService.parseJWT(jwt) as {
        'https://hasura.io/jwt/claims': {
          'x-hasura-user-id': string,
          'x-hasura-user-role': string
        }
      }

      const result = await req.appService.getUserPlan(parsed["https://hasura.io/jwt/claims"]["x-hasura-user-id"]).toPromise()

      let isProUser = false

      if (!result.error) {
        isProUser = result.data?.users_by_pk.plan === 'pro'
      } else {
        logError(result.error, parsed["https://hasura.io/jwt/claims"]["x-hasura-user-id"])
        res.status(500)
        res.json({
          message: 'error'
        })
      }

      if (!isProUser) {
        res.status(400)
        res.json({
          code: 'NOT_PRO_MEMBER',
          message: 'Not a pro member'
        })
      } else {
        next()
      }
    }
  }
}
