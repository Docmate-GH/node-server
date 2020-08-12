import { AppReq } from "..";
import { Response } from "express";
import * as path from 'path'

type DocHoemParams = {
  docId: string
}
export const home = ({
  getSourcePath
}: {
  getSourcePath: (req: AppReq) => string
}) => async (req: AppReq, res: Response) => {

  const { docId } = req.params as DocHoemParams

  let defaultPage = null as null | string

  const getDocResult = await req.appService.client.query<{
    doc_by_pk: {
      default_page?: string
    }
  }>(
    `
    query($docId: uuid!) {
      doc_by_pk(id: $docId) {
        default_page
      }
    }
    `, { docId }
  ).toPromise()

  if (!getDocResult.error) {
    if (getDocResult.data?.doc_by_pk.default_page) {
      defaultPage = getDocResult.data?.doc_by_pk.default_page
    }
  } else {
    // TODO: getdoc result error
  }

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
      order_by: [
        {
          index: asc
        },
        {
          created_at: asc
        }
      ],
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

    const sidebar = doc.pages.filter(page => page.slug !== defaultPage).map(page => {
      return {
        title: page.title,
        link: '/' + page.slug
      }
    })

    const docuteParams = {
      title: doc.title,
      target: '#docute',
      sourcePath: getSourcePath(req),

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

  let pageSlug = path.basename(params.fileName, '.md')

  if (pageSlug === 'README') {
    const getDocResult = await req.appService.client.query<{
      doc_by_pk: {
        default_page?: string
      }
    }>(
      `
      query($docId: uuid!) {
        doc_by_pk(id: $docId) {
          default_page
        }
      }
      `, { docId: params.docId }
    ).toPromise()

    if (!getDocResult.error) {
      if (getDocResult.data?.doc_by_pk.default_page) {
        pageSlug = getDocResult.data.doc_by_pk.default_page
      }
    } else {
      // TODO: getdoc result error
    }
  }

  const result = await req.appService.client.query<{
    page: {
      id: string,
      slug: string,
      content: string,
      title: string
    },
    doc_by_pk: {
      default_page: string
    }
  }>(`
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
  }).toPromise()

  const page = result.data?.page[0]

  if (page) {
    res.type('text/markdown')
    res.send(page?.content)
  } else {
    res.send('Not found')
  }

}
