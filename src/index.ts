import * as express from 'express'
import * as path from 'path'
import { connect } from './db'
import passport, { FAKE_USER } from './passport'

import * as session from 'express-session'
import { User } from './models/User'


export interface AppReq extends express.Request {
  user?: User
}

connect().then((db) => {
  const app = express()

  const PORT = 3000

  app.use(require('express-session')({ secret: 'foo' }))
  app.use(require('cookie-parser')())
  app.use(require('body-parser').urlencoded({ extended: false }))

  app.use('/static', express.static(path.resolve(__dirname, '../static')))


  app.use((req, res, next) => {
    // @ts-expect-error
    req.user = FAKE_USER
    next()
  })

  app.get('/' , async (req: AppReq, res) => {
    console.log(req.user)
    res.send('works')
  })

  app.get('/login', (req, res) => {
    res.send('hi')
  })

  app.listen(PORT, () => {
    console.log('running at', PORT)
  })
})