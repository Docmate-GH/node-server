import * as express from 'express'
import * as path from 'path'
import { connect } from './db'
import passport, { FAKE_USER } from './passport'

import * as nunjucks from 'nunjucks'
import { User } from './models/User'

import * as doc from './controllers/doc'
import { Connection } from 'typeorm'

export interface AppReq extends express.Request {
  user?: User,
  db: Connection
}

connect().then((db) => {
  const app = express()

  const PORT = 3000

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

  app.use('/static', express.static(path.resolve(__dirname, '../static')))


  app.use((req: AppReq, res, next) => {
    req.user = FAKE_USER
    req.db = db
    next()
  })

  app.get('/' , async (req: AppReq, res) => {
    console.log(req.user)
    res.send('works')
  })

  app.get('/login', (req, res) => {
    res.send('hi')
  })
  
  app.post('/api/v1/document', doc.create)

  app.get('/docs/:slug', doc.home)

  app.listen(PORT, () => {
    console.log('running at', PORT)
  })
})