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
const express = require("express");
const path = require("path");
const nunjucks = require("nunjucks");
const doc = require("./controllers/doc");
const AppService_1 = require("./AppService");
const core_1 = require("@urql/core");
const fetch = require("node-fetch");
const actions_1 = require("./handlers/actions");
require('dotenv').config();
const isProd = process.env.NODE_ENV === 'production';
const app = express();
const PORT = isProd ? 80 : 3000;
const client = core_1.createClient({
    url: 'http://localhost:8080/v1/graphql',
    fetch,
    requestPolicy: 'network-only',
    fetchOptions: {
        headers: {
            'x-hasura-admin-secret': process.env.DOCMATE_HASURA_SECRET
        }
    }
});
const appService = new AppService_1.default(client);
// views
nunjucks.configure('views', {
    express: app,
    autoescape: false
});
app.set('views', path.resolve(__dirname, '../views'));
app.use(require('express-session')({ secret: 'foo' }));
app.use(require('cookie-parser')());
app.use(require('body-parser').json());
app.use(require('body-parser').urlencoded({ extended: false }));
app.use(require('morgan')(isProd ? 'combined' : 'dev'));
app.use('/static', express.static(path.resolve(__dirname, '../static')));
app.use((req, res, next) => {
    // req.user = FAKE_USER
    req.appService = appService;
    next();
});
app.get('/login', (req, res) => {
    res.send('hi');
});
app.get('/docs/:docId', doc.home);
app.get('/docs/:docId/:fileName', doc.renderFile);
app.post('/handler/actions/signUp', actions_1.signUpAction);
app.post('/handler/actions/signIn', actions_1.signinAction);
app.post('/handler/actions/createTeam', actions_1.createTeam);
app.post('/handler/actions/joinTeam', actions_1.joinTeam);
app.post('/handler/actions/revokeInviteId', actions_1.revokeInviteId);
app.get('*', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.render('index.html');
}));
app.listen(PORT, () => {
    console.log('running at', PORT);
});
