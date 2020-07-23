import * as express from 'express'
import * as path from 'path'


const app = express()

const PORT = 3000

app.use('/static', express.static(path.resolve(__dirname, '../static')))

app.get('/', async (req, res) => {
  res.send('works')
})

app.listen(PORT, () => {
  console.log('running at', PORT)
})