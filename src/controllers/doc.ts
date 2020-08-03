import { AppReq } from "..";
import { Response } from "express";
import { Doc } from "../models/Doc";
import { nanoid } from 'nanoid'
import AppService from "../services";
import { Page } from "../models/Page";
import * as path from 'path'

type CreateDocParams = {
  title: string,
  slug?: string
}
export async function create(req: AppReq, res: Response) {

  let { title, slug } = req.body as CreateDocParams
  const appService = new AppService(req.db)

  const doc = await appService.createNewDoc(title, slug)
  console.log(doc)
  res.json({
    data: doc
  })
}


type DocHoemParams = {
  slug: string
}
export async function home(req: AppReq, res: Response) {

  const { slug } = req.params as DocHoemParams
  const docRepo = req.db.getRepository(Doc)

  const doc = await docRepo.findOne({where: { slug }, relations: ['pages']})

  if (doc) {

    const sidebar = doc.pages.map(page => {
      return {
        title: page.title,
        link: '/' + page.slug
      }
    })

    const docuteParams = {
      title: doc.title,
      target: '#docute',
      sourcePath: `/docs/${doc.slug}`,

      sidebar
    }

    res.render('docute.html', {
      params: docuteParams
    })

  } else {
    res.status(404)
    res.json({
      message: 'not found'
    })
  }

}

type RenderFileParams = {
  docSlug: string
  fileName: string
}
export async function renderFile(req: AppReq, res: Response) {
  const params = req.params as RenderFileParams
  const appService = new AppService(req.db)

  const pageSlug = path.basename(params.fileName, '.md')
  const page = await appService.fetchPage(params.docSlug, pageSlug)

  if (page) {
    res.type('text/markdown')
    res.send(page?.content)
  } else {
    res.send('Not found')
  }

}


type CreateNewPageParams = {
  docId: string,
  page: {
    title: string,
    content: string,
  }
}
export async function createNewPage(req: AppReq, res: Response) {
  const appService = new AppService(req.db)

  const params = req.body as CreateNewPageParams

  const page = new Page()
  page.title = params.page.title
  page.content = params.page.content
  page.slug = nanoid(8)
  page.index = 0

  const doc = await appService.createNewPageByDocId(params.docId, page)

  if (doc) {
    res.json({
      data: {
        doc, page
      }
    })
  } else {
    res.status(501)
    res.json({
      message: 'create page error'
    })
  }
}