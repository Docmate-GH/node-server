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
exports.schema = exports.Resolver = void 0;
const graphql_1 = require("graphql");
const path = require("path");
const fs = require("fs");
const Doc_1 = require("./models/Doc");
const Page_1 = require("./models/Page");
const nanoid_1 = require("nanoid");
class Resolver {
    constructor(connection) {
        this.docRepo = connection.getRepository(Doc_1.Doc);
        this.pageRepo = connection.getRepository(Page_1.Page);
    }
    allDocs() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.docRepo.find();
        });
    }
    createDoc(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const doc = new Doc_1.Doc();
            doc.title = params.title;
            doc.slug = params.slug || nanoid_1.nanoid(8);
            return yield this.docRepo.save(doc);
        });
    }
    createPageInDoc(params) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const doc = yield this.docRepo.findOne({ where: { id: params.docId }, relations: ['pages'] });
            const page = new Page_1.Page();
            page.title = ((_a = params.input) === null || _a === void 0 ? void 0 : _a.title) || 'Untitled';
            page.content = ((_b = params.input) === null || _b === void 0 ? void 0 : _b.content) || '# Untitled';
            page.slug = nanoid_1.nanoid(8);
            page.index = 0;
            if (doc) {
                doc.pages.push(page);
                const result = yield this.docRepo.save(doc);
                return {
                    doc: result,
                    page
                };
            }
            else {
                null;
            }
        });
    }
    getDocById(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const relations = [];
            if (params.withPages === true) {
                relations.push('pages');
            }
            const doc = yield this.docRepo.findOne(params.docId, { relations });
            return doc;
        });
    }
    getDocBySlug(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const doc = yield this.docRepo.findOne({ where: { slug: params.slug }, relations: ['pages'] });
            return doc;
        });
    }
    getPage(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const page = yield this.pageRepo
                .createQueryBuilder('page')
                .leftJoinAndSelect('page.doc', 'doc')
                .where('doc.id = :docId', { docId: params.docId })
                .andWhere('page.slug = :pageSlug', { pageSlug: params.pageSlug })
                .getOne();
            return page;
        });
    }
    editPage(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const page = yield this.getPage({ docId: params.docId, pageSlug: params.pageSlug });
            if (page) {
                if (params.input.title !== undefined) {
                    page.title = params.input.title;
                }
                if (params.input.content !== undefined) {
                    page.content = params.input.content;
                }
                return yield this.pageRepo.save(page);
            }
            else {
                // TODO: page not found
                return null;
            }
        });
    }
    deletePage(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const page = yield this.getPage({ docId: params.docId, pageSlug: params.pageSlug });
            if (page) {
            }
            else {
                return null;
            }
        });
    }
}
exports.Resolver = Resolver;
const resolveSchema = name => path.resolve(__dirname, '../schema', `${name}.gql`);
const readContent = file => fs.readFileSync(file, { encoding: 'utf-8' });
exports.schema = graphql_1.buildSchema([
    'Types',
    'Query'
].map(resolveSchema).map(readContent).join('\n'));
