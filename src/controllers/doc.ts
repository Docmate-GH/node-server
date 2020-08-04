import { AppReq } from "..";
import { Response } from "express";
import * as path from 'path'

type DocHoemParams = {
  slug: string
}
export async function home(req: AppReq, res: Response) {

  const { slug } = req.params as DocHoemParams

  const result = await req.appService.client.query<{
    doc: {
      title: string,
      slug: string,
      pages: {
        id: string,
        title: string,
        slug: string
      }[]
    }[]
  }>(`
  query($docSlug: String) {
    doc(
      where: { slug: { _eq: $docSlug } }
    ) {
     title, slug, pages {
        id, title, slug
      }
    }
  }
  `, {
    docSlug: slug
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

  const pageSlug = path.basename(params.fileName, '.md')

  const result = await req.appService.client.query<{
    page: {
      id: string,
      slug: string,
      content: string,
      title: string
    }
  }>(`
    query($docSlug: String!, $pageSlug: String!) {
      page(
        where: {
          doc_slug: { _eq: $docSlug },
          slug: { _eq: $pageSlug }
        }
      ) {
        id, slug, content, title
      }
    }
  `, {
    docSlug: params.docSlug,
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
