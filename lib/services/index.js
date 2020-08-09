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
const Doc_1 = require("../models/Doc");
const Page_1 = require("../models/Page");
const nanoid_1 = require("nanoid");
class AppService {
    constructor(connection) {
        this.docRepo = connection.getRepository(Doc_1.Doc);
        this.pageRepo = connection.getRepository(Page_1.Page);
    }
    createNewDoc(title, slug) {
        return __awaiter(this, void 0, void 0, function* () {
            const doc = new Doc_1.Doc();
            doc.title = title;
            doc.slug = slug || nanoid_1.nanoid(8);
            return yield this.docRepo.save(doc);
        });
    }
    createNewPageByDocId(docId, page) {
        return __awaiter(this, void 0, void 0, function* () {
            const doc = yield this.docRepo.findOne({ where: { id: docId }, relations: ['pages'] });
            if (doc) {
                doc.pages.push(page);
                console.log(doc);
                return yield this.docRepo.save(doc);
            }
            else {
                null;
            }
        });
    }
    fetchPage(docSlug, pageSlug) {
        return __awaiter(this, void 0, void 0, function* () {
            const page = yield this.pageRepo
                .createQueryBuilder('page')
                .leftJoinAndSelect('page.doc', 'doc')
                .where('page.slug = :pageSlug', { pageSlug })
                .andWhere('doc.slug = :docSlug', { docSlug })
                .getOne();
            return page;
        });
    }
}
exports.default = AppService;
