const express = require('express')
const cors = require('cors')
const multer = require('multer')
const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')
const newman = require('newman')
const jsonDiff = require('json-diff')
const { Diff2Html } = require('diff2html')
const jsondiffpatch = require('jsondiffpatch').create()
const { rimraf } = require('rimraf')

const sendEmail = require('./sendEmail')

const app = express()

const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

const filePath = '/automation.json'

app.use(cors())

app.get('/', (req, res) => {
  res.send('Hello world')
})

// app.get('/run-collection', (req, resp) => {
//   exec(
//     'newman run automation.postman_collection.json',
//     (err, stdout, stderr) => {
//       if (err) {
//         console.log(err)
//         return resp.status(500).send('Internal Server Error')
//       }
//       console.log(`stdout: ${stdout}`)
//       console.error(`stderr: ${stderr}`)
//       resp
//         .status(200)
//         .send('Collection run completed. Check the console for details.')
//     }
//   )
// })

app.get('/run-collection', (req, resp) => {
  const data = fs.readFileSync(path.join(__dirname, filePath), 'utf8')

  const jsonData = JSON.parse(data)

  newman.run(
    {
      collection: jsonData,
      reporters: ['htmlextra'],
      // reporter: { html: { export: reportFile } },
    },
    (err, summary) => {
      if (err) {
        console.error('Error running Postman collection:', err)
        return resp
          .status(500)
          .json({ error: 'Error running Postman collection' })
      } else {
        console.log('Postman collection run complete!')
        resp.sendFile(
          path.join(__dirname, 'newman', fs.readdirSync(path.join('newman'))[0])
        )
        resp.on('finish', () => {
          console.log('Response sent successfully!')

          rimraf(path.join(__dirname, 'newman'))
        })
      }
    }
  )
})

// Upload and run collection in one go and send a report back
app.post('/run-collection', upload.single('collection'), (req, resp) => {
  const fileBuffer = req.file.buffer
  const jsonData = JSON.parse(fileBuffer.toString())

  const reportFile = path.join(__dirname, 'myReport', 'report.html')

  console.log(reportFile)

  const newManResponse = newman.run(
    {
      collection: jsonData,
      reporters: ['htmlextra'],
      reporter: { html: { export: reportFile } },
    },
    (err, summary) => {
      if (err) {
        console.error('Error running Postman collection:', err)
        return resp
          .status(500)
          .json({ error: 'Error running Postman collection' })
      } else {
        console.log('Postman collection run complete!')
        return sendEmail(resp)
      }
    }
  )
})

app.get('/diff', (req, resp) => {
  const stage = {
    name: 'Sai',
    age: 25,
    address: {
      city: 'Hyderabad',
      state: 'Telangana',
      pin: '500091',
    },
    position: 'Software Engineer',
  }

  const prod = {
    name: 'Kiran',
    age: 22,
    address: {
      city: 'Secundrabad',
      state: 'Telangana',
      pin: '500081',
    },
    position: 'Software Engineer',
  }

  const differences = jsondiffpatch.diff(stage, prod)

  //   const diffHtml = Diff2Html.getPrettyHtml({
  //     inputFormat: 'json',
  //     diff: Diff2Html.getJsonFromDiff(
  //       Diff2Html.Diff.createTwoFilesPatch(
  //         JSON.stringify(stage, null, 2),
  //         JSON.stringify(prod, null, 2)
  //       )
  //     ),
  //     outputFormat: 'side-by-side',
  //   })

  //   console.log(diffHtml)

  //   const html = jsondiffpatch.formatters.html.format(differences, stage)

  if (differences) {
    const timestamp = new Date().getTime()
    const filePath = path.join(
      __dirname,
      'differences',
      `differences_report_${timestamp}.html`
    )
    console.log('Differences found between stage and prod responses:')
    console.log('differences', differences)

    console.log('HTML report generated at:', filePath)

    // fs.writeFileSync(filePath, html)
    return resp.json({ differences: differences })
  } else {
    console.log('No differences found between stage and prod responses.')
    return resp.json({ differences: 'No differences found' })
  }
})

app.listen(3005, () => {
  console.log('Server is running on port 3005')
})
