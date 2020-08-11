"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.revokeInviteId = exports.joinTeam = exports.createTeam = exports.signinAction = exports.signUpAction = void 0;
const crypto_1 = require("crypto");
const uuid_1 = require("uuid");
const logger_1 = require("../logger");
const utils_1 = require("../utils");
function signUpAction(req, response) {
    return __awaiter(this, void 0, void 0, function* () {
        const { input: { input: { email, password, password_confirm } }, session_variables } = req.body;
        if (password !== password_confirm) {
            response.status(400);
            response.json({
                code: "400",
                message: 'Password confirm failed'
            });
            return;
        }
        // find exist 
        const findExistUserResult = yield req.appService.client.query(`
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
  `, { email }).toPromise();
        if (findExistUserResult.data) {
            if (findExistUserResult.data.users.length > 0) {
                // user exist
                response.status(400);
                response.json({
                    message: 'Email exist!'
                });
            }
            else {
                const encryptedPassword = yield req.appService.encryptPassword(password);
                const defaultUserName = email.split('@')[0];
                const createUserResult = yield req.appService.client.query(`
        mutation($email: String!, $password: String!, $username: String!, $verified: Boolean!) {
          insert_users_one(object: {
            email: $email,
            password: $password,
            username: $username,
            verified: $verified
          }) {
            email, id
          }
        }
      `, {
                    verified: utils_1.isUserVerifyEnabled ? false : true,
                    email,
                    password: encryptedPassword,
                    username: defaultUserName // use email name as username
                }).toPromise();
                if (!createUserResult.error) {
                    // create team for user
                    const createTeamResult = yield req.appService.createTeam(defaultUserName, createUserResult.data.insert_users_one.id, true);
                    if (!createTeamResult.error) {
                        // join team
                        const joinTeamResult = yield req.appService.joinTeam(createTeamResult.data.insert_teams_one.id, createUserResult.data.insert_users_one.id);
                        if (!joinTeamResult.error) {
                            response.json({
                                id: createUserResult.data.insert_users_one.id
                            });
                        }
                        else {
                            logger_1.logError(joinTeamResult.error, session_variables["x-hasura-user-id"]);
                        }
                    }
                    else {
                        logger_1.logError(createTeamResult.error, session_variables["x-hasura-user-id"]);
                    }
                }
                else {
                    response.status(400);
                    logger_1.logError(createUserResult.error, session_variables["x-hasura-user-id"]);
                    response.json({
                        message: 'Unknown error'
                    });
                }
            }
        }
    });
}
exports.signUpAction = signUpAction;
function signinAction(req, response) {
    return __awaiter(this, void 0, void 0, function* () {
        const { input: { input: { email, password } }, session_variables } = req.body;
        const findUserByEmailResult = yield req.appService.client.query(`
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
        }).toPromise();
        if (!findUserByEmailResult.error) {
            if (findUserByEmailResult.data.users.length > 0) {
                const user = findUserByEmailResult.data.users[0];
                if (yield req.appService.comparePassword(password, user.password)) {
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
                        avatar: crypto_1.createHash('md5').update(user.email.toLowerCase()).digest('hex')
                    });
                }
                else {
                    // password not correct
                    response.status(400);
                    response.json({
                        code: '400',
                        message: 'Password not correct'
                    });
                }
            }
            else {
                response.status(404);
                response.json({
                    code: '404',
                    message: 'Email not exist'
                });
            }
        }
        else {
            logger_1.logError(findUserByEmailResult.error, session_variables["x-hasura-user-id"]);
            response.status(400);
            response.json({
                code: '400',
                message: 'Unknown error'
            });
        }
    });
}
exports.signinAction = signinAction;
function createTeam(req, response) {
    return __awaiter(this, void 0, void 0, function* () {
        const { input: { input: { title } }, session_variables } = req.body;
        const createTeamResult = yield req.appService.createTeam(title, session_variables['x-hasura-user-id']);
        if (!createTeamResult.error) {
            const teamId = createTeamResult.data.insert_teams_one.id;
            // join team
            const joinTeamResult = yield req.appService.joinTeam(teamId, session_variables["x-hasura-user-id"]);
            if (!joinTeamResult.error) {
                response.json({
                    teamId: joinTeamResult.data.insert_user_team_one.team_id
                });
            }
            else {
                logger_1.logError(joinTeamResult.error, session_variables["x-hasura-user-id"]);
                response.status(400);
                response.json({
                    message: 'join team error'
                });
            }
        }
        else {
            logger_1.logError(createTeamResult.error, session_variables["x-hasura-user-id"]);
            response.status(400);
            response.json({
                message: 'create team error'
            });
        }
    });
}
exports.createTeam = createTeam;
function joinTeam(req, response) {
    return __awaiter(this, void 0, void 0, function* () {
        const { input: { inviteId }, session_variables } = req.body;
        const findTeamByInviteId = yield req.appService.client.query(`
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
        }).toPromise();
        if (findTeamByInviteId.error) {
            logger_1.logError(findTeamByInviteId.error, session_variables["x-hasura-user-id"]);
            response.status(400);
            response.json({
                message: 'find team error'
            });
            return;
        }
        if (findTeamByInviteId.data.teams.length > 0) {
            const team = findTeamByInviteId.data.teams[0];
            const joinTeamResult = yield req.appService.client.mutation(`
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
            }).toPromise();
            if (joinTeamResult.error) {
                logger_1.logError(joinTeamResult.error, session_variables["x-hasura-user-id"]);
                response.status(400);
                response.json({
                    message: 'join team error'
                });
            }
            else {
                response.json({
                    success: true,
                    teamId: team.id
                });
            }
        }
        else {
            response.status(400);
            response.json({
                success: false,
                message: 'Invalid invite link'
            });
        }
    });
}
exports.joinTeam = joinTeam;
function revokeInviteId(req, response) {
    return __awaiter(this, void 0, void 0, function* () {
        const { session_variables, input: { teamId } } = req.body;
        const getTeamResult = yield req.appService.client.query(`
    query($teamId: uuid!) {
      teams_by_pk(id: $teamId) {
        master
      }
    }
  `, { teamId }).toPromise();
        if (getTeamResult.data) {
            if (getTeamResult.data.teams_by_pk.master === session_variables["x-hasura-user-id"]) {
                const newId = uuid_1.v4();
                const updateResult = yield req.appService.client.mutation(`
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
                }).toPromise();
                if (!updateResult.error) {
                    response.json({
                        code: updateResult.data.update_teams_by_pk.invite_id
                    });
                }
                else {
                    logger_1.logError(updateResult.error, session_variables["x-hasura-user-id"]);
                    response.status(400);
                    response.json({
                        message: 'Update errror'
                    });
                }
            }
            else {
                response.status(403);
                response.json({
                    message: 'No permission'
                });
            }
        }
        else {
            logger_1.logError(getTeamResult.error, session_variables["x-hasura-user-id"]);
            response.status(400);
            response.json({});
        }
    });
}
exports.revokeInviteId = revokeInviteId;
