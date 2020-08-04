import { buildSchema } from "graphql"
import path = require("path")
import fs = require("fs")
import { Connection, Repository } from "typeorm"
import { Doc } from "./models/Doc"
import { Page } from "./models/Page"
import { nanoid } from "nanoid";

export class Resolver {

  docRepo: Repository<Doc>
  pageRepo: Repository<Page>

  constructor(connection: Connection) {
    this.docRepo = connection.getRepository(Doc)
    this.pageRepo = connection.getRepository(Page)
  }

  async allDocs() {
    return await this.docRepo.find()
  }

  async createDoc(params: {
    title: string,
    slug?: string
  }) {
    const doc = new Doc()
    doc.title = params.title
    doc.slug = params.slug || nanoid(8)

    return await this.docRepo.save(doc)
  }

  async createPageInDoc(params: {
    docId: string,
    input?: {
      title?: string
      content?: string
    }
  }) {

    const doc = await this.docRepo.findOne({ where: { id: params.docId }, relations: ['pages'] })
    const page = new Page()

    page.title = params.input?.title || 'Untitled'
    page.content = params.input?.content || '# Untitled'
    page.slug = nanoid(8)
    page.index = 0

    if (doc) {
      doc.pages.push(page)
      const result = await this.docRepo.save(doc)

      return {
        doc: result,
        page
      }
    } else {
      null
    }
  }

  async getDocById(params: {
    docId: string,
    withPages?: boolean
  }) {
    const relations = [] as string[]
    if (params.withPages === true) {
      relations.push('pages')
    }
    const doc = await this.docRepo.findOne(params.docId, { relations })
    return doc
  }

  async getDocBySlug(params: {
    slug: string
  }) {
    const doc = await this.docRepo.findOne({ where: { slug: params.slug }, relations: ['pages'] })
    return doc
  }

  async getPage(params: {
    docId: string,
    pageSlug: string
  }) {
    const page = await this.pageRepo
      .createQueryBuilder('page')
      .leftJoinAndSelect('page.doc', 'doc')
      .where('doc.id = :docId', { docId: params.docId })
      .andWhere('page.slug = :pageSlug', { pageSlug: params.pageSlug })
      .getOne()

    return page
  }

  async editPage(params: {
    docId: string,
    pageSlug: string,
    input: {
      title?: string,
      content?: string
    }
  }) {
    const page = await this.getPage({ docId: params.docId, pageSlug: params.pageSlug })
    if (page) {
      if (params.input.title !== undefined) {
        page.title = params.input.title
      }
      if (params.input.content !== undefined) {
        page.content = params.input.content
      }
      return await this.pageRepo.save(page)
    } else {
      // TODO: page not found
      return null
    }
  }

  async deletePage(params: {
    docId: string,
    pageSlug: string,
  }) {
    const page = await this.getPage({ docId: params.docId, pageSlug: params.pageSlug })
    if (page) {

    } else {
      return null
    }
  }
}

const resolveSchema = name => path.resolve(__dirname, '../schema', `${name}.gql`)
const readContent = file => fs.readFileSync(file, { encoding: 'utf-8' })

export const schema = buildSchema([
  'Types',
  'Query'
].map(resolveSchema).map(readContent).join('\n'))
