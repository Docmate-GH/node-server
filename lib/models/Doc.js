"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Doc = void 0;
const typeorm_1 = require("typeorm");
const Page_1 = require("./Page");
let Doc = class Doc {
};
__decorate([
    typeorm_1.PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], Doc.prototype, "id", void 0);
__decorate([
    typeorm_1.Column(),
    __metadata("design:type", String)
], Doc.prototype, "slug", void 0);
__decorate([
    typeorm_1.Column(),
    __metadata("design:type", String)
], Doc.prototype, "title", void 0);
__decorate([
    typeorm_1.OneToMany(type => Page_1.Page, page => page.doc, {
        cascade: true
    }),
    __metadata("design:type", Array)
], Doc.prototype, "pages", void 0);
__decorate([
    typeorm_1.Column('text', {
        default: '[]'
    }),
    __metadata("design:type", String)
], Doc.prototype, "nav", void 0);
__decorate([
    typeorm_1.Column('text', {
        default: '[]'
    }),
    __metadata("design:type", String)
], Doc.prototype, "sidebar", void 0);
__decorate([
    typeorm_1.CreateDateColumn(),
    __metadata("design:type", Date)
], Doc.prototype, "createdAt", void 0);
__decorate([
    typeorm_1.UpdateDateColumn(),
    __metadata("design:type", Date)
], Doc.prototype, "updatedAt", void 0);
__decorate([
    typeorm_1.DeleteDateColumn(),
    __metadata("design:type", Date)
], Doc.prototype, "deletedAt", void 0);
__decorate([
    typeorm_1.Column('boolean'),
    __metadata("design:type", Boolean)
], Doc.prototype, "isDeleted", void 0);
Doc = __decorate([
    typeorm_1.Entity()
], Doc);
exports.Doc = Doc;
