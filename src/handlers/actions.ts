import { AppReq } from "..";
import { Response } from "express";

export function signUpAction(req: AppReq, response: Response) {
  response.json({
    id: 'foo'
  })
}