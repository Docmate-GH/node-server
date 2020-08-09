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
exports.AddDeletedAt1596517954266 = void 0;
class AddDeletedAt1596517954266 {
    constructor() {
        this.name = 'AddDeletedAt1596517954266';
    }
    up(queryRunner) {
        return __awaiter(this, void 0, void 0, function* () {
            yield queryRunner.query(`CREATE TABLE "temporary_page" ("id" varchar PRIMARY KEY NOT NULL, "slug" varchar NOT NULL, "index" integer NOT NULL, "title" varchar NOT NULL, "content" text NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "docId" varchar, "deletedAt" datetime, CONSTRAINT "FK_21450f5ab19b162567101221e86" FOREIGN KEY ("docId") REFERENCES "doc" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
            yield queryRunner.query(`INSERT INTO "temporary_page"("id", "slug", "index", "title", "content", "createdAt", "updatedAt", "docId") SELECT "id", "slug", "index", "title", "content", "createdAt", "updatedAt", "docId" FROM "page"`);
            yield queryRunner.query(`DROP TABLE "page"`);
            yield queryRunner.query(`ALTER TABLE "temporary_page" RENAME TO "page"`);
            yield queryRunner.query(`CREATE TABLE "temporary_doc" ("id" varchar PRIMARY KEY NOT NULL, "slug" varchar NOT NULL, "title" varchar NOT NULL, "nav" text NOT NULL DEFAULT ('[]'), "sidebar" text NOT NULL DEFAULT ('[]'), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "deletedAt" datetime)`);
            yield queryRunner.query(`INSERT INTO "temporary_doc"("id", "slug", "title", "nav", "sidebar", "createdAt", "updatedAt") SELECT "id", "slug", "title", "nav", "sidebar", "createdAt", "updatedAt" FROM "doc"`);
            yield queryRunner.query(`DROP TABLE "doc"`);
            yield queryRunner.query(`ALTER TABLE "temporary_doc" RENAME TO "doc"`);
            yield queryRunner.query(`CREATE TABLE "temporary_user" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "email" varchar NOT NULL, "password" varchar NOT NULL, "createdDate" datetime NOT NULL DEFAULT (datetime('now')), "deletedAt" datetime)`);
            yield queryRunner.query(`INSERT INTO "temporary_user"("id", "name", "email", "password", "createdDate") SELECT "id", "name", "email", "password", "createdDate" FROM "user"`);
            yield queryRunner.query(`DROP TABLE "user"`);
            yield queryRunner.query(`ALTER TABLE "temporary_user" RENAME TO "user"`);
        });
    }
    down(queryRunner) {
        return __awaiter(this, void 0, void 0, function* () {
            yield queryRunner.query(`ALTER TABLE "user" RENAME TO "temporary_user"`);
            yield queryRunner.query(`CREATE TABLE "user" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "email" varchar NOT NULL, "password" varchar NOT NULL, "createdDate" datetime NOT NULL DEFAULT (datetime('now')))`);
            yield queryRunner.query(`INSERT INTO "user"("id", "name", "email", "password", "createdDate") SELECT "id", "name", "email", "password", "createdDate" FROM "temporary_user"`);
            yield queryRunner.query(`DROP TABLE "temporary_user"`);
            yield queryRunner.query(`ALTER TABLE "doc" RENAME TO "temporary_doc"`);
            yield queryRunner.query(`CREATE TABLE "doc" ("id" varchar PRIMARY KEY NOT NULL, "slug" varchar NOT NULL, "title" varchar NOT NULL, "nav" text NOT NULL DEFAULT ('[]'), "sidebar" text NOT NULL DEFAULT ('[]'), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')))`);
            yield queryRunner.query(`INSERT INTO "doc"("id", "slug", "title", "nav", "sidebar", "createdAt", "updatedAt") SELECT "id", "slug", "title", "nav", "sidebar", "createdAt", "updatedAt" FROM "temporary_doc"`);
            yield queryRunner.query(`DROP TABLE "temporary_doc"`);
            yield queryRunner.query(`ALTER TABLE "page" RENAME TO "temporary_page"`);
            yield queryRunner.query(`CREATE TABLE "page" ("id" varchar PRIMARY KEY NOT NULL, "slug" varchar NOT NULL, "index" integer NOT NULL, "title" varchar NOT NULL, "content" text NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "docId" varchar, CONSTRAINT "FK_21450f5ab19b162567101221e86" FOREIGN KEY ("docId") REFERENCES "doc" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
            yield queryRunner.query(`INSERT INTO "page"("id", "slug", "index", "title", "content", "createdAt", "updatedAt", "docId") SELECT "id", "slug", "index", "title", "content", "createdAt", "updatedAt", "docId" FROM "temporary_page"`);
            yield queryRunner.query(`DROP TABLE "temporary_page"`);
        });
    }
}
exports.AddDeletedAt1596517954266 = AddDeletedAt1596517954266;
