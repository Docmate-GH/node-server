import { AppReq } from "..";
import { Response } from "express";
import * as path from 'path'
import { logError } from "../logger";
import { validate } from 'uuid'
type DocControllerCommonParams = {
  docId
}

type DocResult = {
  doc: {
    title: string,
    id: string,
    code_highlights: string[],
    visibility: 'public' | 'private',
    default_page?: string,
    template: string
    directories: {
      id: string,
      title: string,
      pages: {
        id: string,
        title: string,
        slug: string
      }[]
    }[]
  }[]
}

export const docVisibilityGuard = async (req: AppReq, res: Response, next) => {
  const { docId } = req.params

  if (!validate(docId)) {
    res.status(404).send('')
  }

  const getDocResult = await req.appService.client.query<DocResult>(`
  query($docId: uuid!) {
    doc(
      where: { id: { _eq: $docId }, deleted_at: { _is_null: true } }
    ) {
    visibility,
    default_page,
     code_highlights,
     template,

     title, id, directories(
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
       title, id,
        pages (order_by: [
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
  }
  `, {
    docId
  }).toPromise()

  if (getDocResult.error) {
    logError(getDocResult.error, 'docGuard')
    res.status(500).send('')
  } else {
    if (getDocResult.data!.doc.length > 0) {
      const doc = getDocResult.data!.doc[0]

      if (doc.visibility === 'public') {
        res.locals.doc = doc
        next()
      } else if (doc.visibility === 'private') {
        const jwtToken = req.cookies['__DOCMATE__DOC_TOKEN__']

        if (jwtToken) {
          try {
            const parsed = req.appService.parseJWT(jwtToken)
            const userId = parsed.userId

            // find if a member
            const findMember = await req.appService.client.query<{
              doc_by_pk: {
                team: {
                  team_users: {
                    user_id
                  }[]
                }
              }
            }>(`
              query ($docId: uuid!, $userId: uuid!) {
                doc_by_pk(id: $docId) {
                  team {
                    team_users(where: {
                      user_id: {_eq: $userId}
                    }) {
                      user_id
                    }
                  }
                }
              }
      `, {
              docId,
              userId
            }).toPromise()

            if (findMember.error) {
              throw findMember.error
            } else {
              if (findMember.data!.doc_by_pk.team.team_users.length > 0) {
                res.locals.doc = doc
                next()
              } else {
                res.status(403)
                return res.send(`It's a private doc`)
              }
            }
          } catch (e) {
            logError(e, 'docGuard')
            res.status(403)
            return res.send('Please sign in first')
          }

        } else {
          res.status(403)
          return res.send('Please sign in first')
        }
      } else {
        const error = new Error(`Unknown visibility type: ${doc.visibility}`)
        logError(error, 'docGuard')
        res.status(500)
        return res.send('Doc not found')
      }

    } else {
      res.status(404)
      return res.send('Doc not found')
    }
  }
}

function renderDocute(doc: DocResult['doc'][0], req: AppReq, res: Response, {
  sourcePath
}: {
  sourcePath
}) {
  let defaultPage = doc.default_page || null

  const sidebar = doc.directories.map(directory => {
    return {
      title: directory.title,
      children: directory.pages.map(page => {
        return {
          title: page.title,
          link: '/' + page.slug
        }
      })
    }
  })

  const docuteParams = {
    title: doc.title,
    target: '#docute',
    sourcePath,
    highlight: doc.code_highlights,
    sidebar
  }

  res.render('docute.html', {
    params: docuteParams
  })
}

function renderDocsify(doc: DocResult['doc'][0], req: AppReq, res: Response, {
  sourcePath
}: {
  sourcePath: string
}) {

  const docsifyParams = {
    title: doc.title,
    basePath: sourcePath,
    loadSidebar: true,
    name: doc.title
  }

  res.render('docsify.html', {
    params: docsifyParams,
    highlights: doc.code_highlights
  })
}

export const home = ({
  getSourcePath
}: {
  getSourcePath: (req: AppReq, template: string) => string
}) => async (req: AppReq, res: Response) => {

  const doc = res.locals.doc as DocResult['doc'][0]

  switch (doc.template) {
    case 'docute':
      renderDocute(doc, req, res, {
        sourcePath: getSourcePath(req, 'docute')
      })
      break
    case 'docsify':
      renderDocsify(doc, req, res, {
        sourcePath: getSourcePath(req, 'docsify')
      })
      break
    default:
  }


}

type RenderFileParams = {
  fileName: string
} & DocControllerCommonParams
export async function renderDocuteFile(req: AppReq, res: Response) {
  const params = req.params as RenderFileParams

  let pageSlug = path.basename(params.fileName, '.md')

  const doc = res.locals.doc as DocResult['doc'][0]

  if (pageSlug === 'README') {
    if (doc.default_page) {
      pageSlug = doc.default_page
    }
  }

  const result = await req.appService.client.query<{
    page: {
      id: string,
      slug: string,
      content: string,
      title: string
    }[]
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

export async function renderDocsifyFile(req: AppReq, res: Response) {
  const params = req.params as RenderFileParams

  let pageSlug = path.basename(params.fileName, '.md')

  const doc = res.locals.doc as DocResult['doc'][0]

  res.type('text/markdown')

  if (pageSlug === '_sidebar') {
    // render docsify sidebar
    const sidebar = doc.directories.map(directory => {
      const parent = `* ${directory.title}\n`
      const children = directory.pages.map(page => {
        return `  * [${page.title}](${page.slug}.md)`
      }).join('\n')
      return parent.concat(children)
    }).join('\n').trim()

    res.send(sidebar)
    return
  }

  if (pageSlug === 'README') {
    if (!doc.default_page) {
      res.send('Home')
      return
    }
  }

  const result = await req.appService.client.query<{
    page: {
      id: string,
      slug: string,
      content: string,
      title: string
    }[]
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
  res.send(page?.content || 'No content')
}