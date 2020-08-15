const isProd = process.env.NODE_ENV === 'production'

if (process.env.READ_ENV === 'true') {
  require('dotenv').config()
}

import * as express from 'express'
import * as path from 'path'

import * as nunjucks from 'nunjucks'

import * as doc from './controllers/doc'
import AppService from './AppService'
import { createClient } from '@urql/core'
import * as fetch from 'node-fetch'
import { signUpAction, signinAction, createTeam, joinTeam, revokeInviteId } from './handlers/actions'
import * as vhost from 'vhost'
import uploadController from './controllers/upload'
import { imagePath, isProEnabled, uploadMiddleware, proPlanGuard, docSubdomain } from './utils'
import { signIn, signUp, signOut } from './controllers/sign'
import { github } from './controllers/auth'

const Sentry = require('@sentry/node');

export interface AppReq extends express.Request {
  // user?: User,
  appService: AppService
}

// sentry
if (process.env.SENTRY_DSN) {
  Sentry.init({ dsn: process.env.SENTRY_DSN })
}

const app = express()

const PORT = process.env.PORT || 3000

const client = createClient({
  url: `http://${process.env.IP_ADDRESS || 'localhost'}:8080/v1/graphql`,
  fetch,
  requestPolicy: 'network-only',
  fetchOptions: {
    headers: {
      'x-hasura-admin-secret': process.env.DOCMATE_HASURA_SECRET!
    }
  }
})

const appService = new AppService(client)

// views
nunjucks.configure('views', {
  express: app,
  autoescape: false
})
app.set('views', path.resolve(__dirname, '../views'))

app.use(require('express-session')({ secret: 'foo' }))
app.use(require('cookie-parser')())

app.use(require('body-parser').json())
app.use(require('body-parser').urlencoded({ extended: false }))

app.use(require('morgan')(isProd ? 'combined' : 'dev'))

app.use('/static', express.static(path.resolve(__dirname, '../static')))
app.use('/images', express.static(imagePath))


app.use((req: AppReq, res, next) => {
  // req.user = FAKE_USER
  req.appService = appService
  next()
})

if (docSubdomain) {
  const docsApp = express()
  docsApp.set('views', path.resolve(__dirname, '../views'))
  docsApp.use(require('body-parser').json())
  docsApp.use(require('body-parser').urlencoded({ extended: false }))
  nunjucks.configure('views', {
    express: docsApp,
    autoescape: false
  })
  docsApp.get('/:docId', doc.docVisibilityGuard, doc.home({
    getSourcePath(req, template: string) {
      return `/${req.params.docId}/files/${template}`
    }
  }))

  app.get('/docs/:docId/files/docute/:fileName', doc.docVisibilityGuard, doc.renderDocuteFile)
  app.get('/docs/:docId/files/docsify/:fileName', doc.docVisibilityGuard, doc.renderDocsifyFile)

  app.use(vhost(path.parse(docSubdomain).base, docsApp))
}

app.get('/docs/:docId', doc.docVisibilityGuard, (req, res, next) => {
  if (docSubdomain) {
    res.redirect(`${docSubdomain}/${req.params.docId}`)
  } else {
    next()
  }
}, doc.home({
  getSourcePath(req, template: string) {
    return `/docs/${req.params.docId}/files/${template}`
  }
}))


app.get('/docs/:docId/files/docute/:fileName', doc.docVisibilityGuard, doc.renderDocuteFile)
app.get('/docs/:docId/files/docsify/:fileName', doc.docVisibilityGuard, doc.renderDocsifyFile)

app.post('/handler/actions/signUp', signUpAction)
app.post('/handler/actions/signIn', signinAction)
app.post('/handler/actions/createTeam', createTeam)
app.post('/handler/actions/joinTeam', joinTeam)
app.post('/handler/actions/revokeInviteId', revokeInviteId)

app.post('/api/v1/upload', proPlanGuard, uploadMiddleware.single('image'), uploadController)

app.post('/api/v1/signIn', signIn)
app.post('/api/v1/signUp', signUp)
app.post('/api/v1/signOut', signOut)

if (process.env.OAUTH === 'true') {
  app.get('/api/v1/auth/github', github)

  app.get('/login/github', (req, res) => {
    res.redirect(`https://github.com/login/oauth/authorize?client_id=${process.env.GH_CLIENT_ID}&redirect_uri=${process.env.GH_REDIRECT_URI}&scope=${process.env.GH_SCOPE}`)
  })
}

app.get('*', async (req: AppReq, res) => {
  res.render('index.html')
})

app.listen(PORT, () => {
  console.log('running at', PORT)
})