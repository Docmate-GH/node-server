import { Connection, Repository } from "typeorm";
import { Doc } from "../models/Doc";
import { Page } from "../models/Page";
import { nanoid } from "nanoid";

export default class AppService {

  docRepo: Repository<Doc>
  pageRepo: Repository<Page>

  constructor(connection: Connection) {
    this.docRepo = connection.getRepository(Doc)
    this.pageRepo = connection.getRepository(Page)
  }

  async createNewDoc(title: string, slug?: string) {
    const doc = new Doc()
    doc.title = title
    doc.slug = slug || nanoid(8)

    return await this.docRepo.save(doc)
  }


  async createNewPageByDocId(docId: string, page: Page) {
    const doc = await this.docRepo.findOne({ where: { id: docId }, relations: ['pages'] })

    if (doc) {
      doc.pages.push(page)
      console.log(doc)
      return await this.docRepo.save(doc)
    } else {
      null
    }
  }

  async fetchPage(docSlug: string, pageSlug: string) {
    const page = await this.pageRepo
      .createQueryBuilder('page')
      .leftJoinAndSelect('page.doc', 'doc')
      .where('page.slug = :pageSlug', { pageSlug })
      .andWhere('doc.slug = :docSlug', { docSlug })
      .getOne()

    return page
  }
}