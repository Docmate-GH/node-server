"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
exports.default = (req, response) => {
    const { cdnURL, filename } = req.file;
    if (utils_1.useOSS) {
        response.json({
            url: cdnURL,
            markdown: `![](${cdnURL})`
        });
    }
    else {
        response.json({
            url: `/images/${filename}`,
            markdown: `![](${`/images/${filename}`})`
        });
    }
};
