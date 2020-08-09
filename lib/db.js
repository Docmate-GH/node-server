"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connect = void 0;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
function connect() {
    return typeorm_1.createConnection();
}
exports.connect = connect;
