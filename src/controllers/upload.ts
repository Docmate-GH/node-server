import { AppReq } from "..";
import { Response } from "express";
import { useOSS } from "../utils";

export default (req: AppReq & {
  file
}, response: Response) => {

  const { cdnURL, filename } = req.file

  if (useOSS) {
    response.json({
      url: cdnURL,
      markdown: `![](${cdnURL})`
    })
  } else {
    response.json({
      url: `/images/${filename}`,
      markdown: `![](${`/images/${filename}`})`
    })
  }
}