import * as passport from 'passport'
import { Strategy, ExtractJwt } from 'passport-jwt'
import { Strategy as LocalStrategy } from 'passport-local'

// export const FAKE_USER = new User()
// FAKE_USER.email = 'lutaonan@huya.com'
// FAKE_USER.id = 'foo'
// FAKE_USER.createdDate = new Date()

// passport.use(new Strategy({
//   jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
//   secretOrKey: 'foo',
// }, (jwtPayload, done) => {
//   return done(null, FAKE_USER)
// }))

// passport.use(new LocalStrategy({
//   usernameField: 'email',
//   passwordField: 'password'
// }, (email, password, done) => {
//   console.log('done')
//   return done(null, FAKE_USER)
// }))

export default passport
