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
exports.renderFile = exports.home = void 0;
const path = require("path");
function home(req, res) {
    var _a, _b, _c;
    return __awaiter(this, void 0, void 0, function* () {
        const { docId } = req.params;
        let defaultPage = null;
        const getDocResult = yield req.appService.client.query(`
    query($docId: uuid!) {
      doc_by_pk(id: $docId) {
        default_page
      }
    }
    `, { docId }).toPromise();
        if (!getDocResult.error) {
            if ((_a = getDocResult.data) === null || _a === void 0 ? void 0 : _a.doc_by_pk.default_page) {
                defaultPage = (_b = getDocResult.data) === null || _b === void 0 ? void 0 : _b.doc_by_pk.default_page;
            }
        }
        else {
            // TODO: getdoc result error
        }
        const result = yield req.appService.client.query(`
  query($docId: uuid!) {
    doc(
      where: { id: { _eq: $docId }, deleted_at: { _is_null: true } }
    ) {
     title, id, pages(
       where: {
         deleted_at: { _is_null: true }
       }
     ) {
        id, title, slug
      }
    }
  }
  `, {
            docId
        }).toPromise();
        const doc = (_c = result.data) === null || _c === void 0 ? void 0 : _c.doc[0];
        if (doc) {
            const sidebar = doc.pages.filter(page => page.slug !== defaultPage).map(page => {
                return {
                    title: page.title,
                    link: '/' + page.slug
                };
            });
            const docuteParams = {
                title: doc.title,
                target: '#docute',
                sourcePath: `/docs/${doc.id}`,
                sidebar
            };
            res.render('docute.html', {
                params: docuteParams
            });
        }
        else {
            res.status(404);
            res.json({
                message: 'not found'
            });
        }
    });
}
exports.home = home;
function renderFile(req, res) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        const params = req.params;
        let pageSlug = path.basename(params.fileName, '.md');
        if (pageSlug === 'README') {
            const getDocResult = yield req.appService.client.query(`
      query($docId: uuid!) {
        doc_by_pk(id: $docId) {
          default_page
        }
      }
      `, { docId: params.docId }).toPromise();
            if (!getDocResult.error) {
                if ((_a = getDocResult.data) === null || _a === void 0 ? void 0 : _a.doc_by_pk.default_page) {
                    pageSlug = getDocResult.data.doc_by_pk.default_page;
                }
            }
            else {
                // TODO: getdoc result error
            }
        }
        const result = yield req.appService.client.query(`
    query($docId: uuid!, $pageSlug: String!) {
      doc_by_pk(id: $docId) {
        default_page
      },
      page(
        where: {
          deleted_at: { _is_null: true },
          doc_id: { _eq: $docId },
          slug: { _eq: $pageSlug }
        }
      ) {
        id, slug, content, title
      }
    }
  `, {
            docId: params.docId,
            pageSlug
        }).toPromise();
        const page = (_b = result.data) === null || _b === void 0 ? void 0 : _b.page[0];
        if (page) {
            res.type('text/markdown');
            res.send(page === null || page === void 0 ? void 0 : page.content);
        }
        else {
            res.send('Not found');
        }
    });
}
exports.renderFile = renderFile;
