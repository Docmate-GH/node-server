import { AppReq } from "..";
import { Response } from "express";
import { getRepository } from "typeorm";
import { Doc } from "../models/Doc";
import { nanoid } from 'nanoid'

type CreateDocParams = {
  title: string,
  slug?: string
}
export async function create(req: AppReq, res: Response) {

  const docRepo = req.db.getRepository(Doc)

  let { title, slug } = req.body as CreateDocParams

  console.log(req.body)

  const doc = new Doc()
  doc.title = title

  doc.slug = slug || nanoid(8)

  await docRepo.save(doc)

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

  const doc = await docRepo.createQueryBuilder('doc').where('doc.slug = :slug', { slug }).getOne()

  if (doc) {
    const docuteParams = {
      title: doc.title,
      target: '#docute',
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