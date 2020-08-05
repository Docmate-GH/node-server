import { AppReq } from "..";
import { Response } from "express";
import * as path from 'path'

type DocHoemParams = {
  docId: string
}
export async function home(req: AppReq, res: Response) {

  const { docId } = req.params as DocHoemParams

  const result = await req.appService.client.query<{
    doc: {
      title: string,
      id: string,
      pages: {
        id: string,
        title: string,
        slug: string
      }[]
    }[]
  }>(`
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
  }).toPromise()

  const doc = result.data?.doc[0]

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
      sourcePath: `/docs/${doc.id}`,

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
  docId: string
  fileName: string
}
export async function renderFile(req: AppReq, res: Response) {
  const params = req.params as RenderFileParams

  const pageSlug = path.basename(params.fileName, '.md')

  const result = await req.appService.client.query<{
    page: {
      id: string,
      slug: string,
      content: string,
      title: string
    }
  }>(`
    query($docId: uuid!, $pageSlug: String!) {
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
  }).toPromise()

  const page = result.data?.page[0]

  if (page) {
    res.type('text/markdown')
    res.send(page?.content)
  } else {
    res.send('Not found')
  }

}
