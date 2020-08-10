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
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
class AppService {
    constructor(client) {
        this.client = client;
    }
    encryptPassword(psw) {
        return __awaiter(this, void 0, void 0, function* () {
            const saltRounds = 10;
            return yield bcrypt.hash(psw, saltRounds);
        });
    }
    comparePassword(psw, hash) {
        return __awaiter(this, void 0, void 0, function* () {
            const matched = yield bcrypt.compare(psw, hash);
            console.log('comparing', psw, hash, matched);
            return matched;
        });
    }
    getJWT(body, claims) {
        const privateKey = (JSON.parse(process.env.DOCMATE_JWT_SECRET)).key;
        const token = jwt.sign(Object.assign(Object.assign({}, body), { 'https://hasura.io/jwt/claims': Object.assign({ 'x-hasura-allowed-roles': ['user'] }, claims) }), privateKey);
        return token;
    }
    createTeam(title, masterUserId, isPersonal = false) {
        return this.client.query(`
      mutation($title: String!, $master: uuid!, $isPersonal: Boolean) {
        insert_teams_one(object: {
          master: $master,
          title: $title,
          is_personal: $isPersonal
        }) {
          id
        }
      }
    `, {
            title,
            master: masterUserId,
            isPersonal
        }).toPromise();
    }
    joinTeam(teamId, userId) {
        return this.client.mutation(`
      mutation($teamId:uuid!, $userId:uuid!) {
        insert_user_team_one(object:{
          team_id:$teamId,
          user_id:$userId
        }) {
          team_id, user_id
        }
      }
  `, {
            teamId,
            userId
        }).toPromise();
    }
}
exports.default = AppService;
