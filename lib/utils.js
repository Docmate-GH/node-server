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
exports.proPlanGuard = exports.uploadMiddleware = exports.isUserVerifyEnabled = exports.useOSS = exports.imagePath = exports.isProEnabled = void 0;
const path = require("path");
const multer = require("multer");
const AliOSS = require("ali-oss");
const uuid_1 = require("uuid");
exports.isProEnabled = process.env.ENABLE_PRO === 'true';
exports.imagePath = process.env.IMAGES_PATH || path.resolve(__dirname, '../images');
exports.useOSS = process.env.OSS_TYPE === 'aliyun';
const logger_1 = require("./logger");
exports.isUserVerifyEnabled = process.env.ENABLE_USER_VERIFY === 'true';
const diskStorage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, exports.imagePath);
    },
    filename(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix);
    }
});
class AliOSSStorage {
    constructor(opts) {
        this.client = new AliOSS(opts.oss);
    }
    _handleFile(req, file, cb) {
        return __awaiter(this, void 0, void 0, function* () {
            const destination = process.env.ALI_OSS_PATH || '/images';
            try {
                const filename = uuid_1.v4();
                const ossName = `${destination}/${filename}`;
                const putResult = yield this.client.putStream(ossName, file.stream, {
                    mime: file.mimetype
                });
                cb(null, { ossURL: putResult.url, cdnURL: process.env.ALI_OSS_CDN ? this.client.getObjectUrl(ossName, process.env.ALI_OSS_CDN) : putResult.url, path: ossName, size: putResult.size, name: putResult.name });
            }
            catch (e) {
                logger_1.logError(e, 'unknow');
            }
        });
    }
    _removeFile(req, file, cb) {
        console.log('remove');
    }
}
AliOSSStorage.make = (opts) => {
    return new AliOSSStorage(opts);
};
exports.uploadMiddleware = multer({
    storage: exports.useOSS ? AliOSSStorage.make({
        oss: {
            region: process.env.ALI_OSS_REGION,
            bucket: process.env.ALI_OSS_BUCKET,
            accessKeyId: process.env.ALI_OSS_ID,
            accessKeySecret: process.env.ALI_OSS_SECRET
        }
    }) : diskStorage
});
exports.proPlanGuard = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!exports.isProEnabled) {
        next();
    }
    else {
        let jwt = req.headers['authorization'];
        if (!jwt) {
            res.status(403);
            res.json({
                message: 'No permission'
            });
        }
        else {
            jwt = jwt.replace('Bearer ', '');
            const parsed = req.appService.parseJWT(jwt);
            const result = yield req.appService.getUserPlan(parsed["https://hasura.io/jwt/claims"]["x-hasura-user-id"]).toPromise();
            let isProUser = false;
            if (!result.error) {
                isProUser = ((_a = result.data) === null || _a === void 0 ? void 0 : _a.users_by_pk.plan) === 'pro';
            }
            else {
                logger_1.logError(result.error, parsed["https://hasura.io/jwt/claims"]["x-hasura-user-id"]);
                res.status(500);
                res.json({
                    message: 'error'
                });
            }
            if (!isProUser) {
                res.status(400);
                res.json({
                    code: 'NOT_PRO_MEMBER',
                    message: 'Not a pro member'
                });
            }
            else {
                next();
            }
        }
    }
});
