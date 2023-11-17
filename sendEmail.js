const nodemailer = require('nodemailer')
const fs = require('fs')
const path = require('path')
const { rimraf } = require('rimraf')

const folderPathToDelete = path.join(__dirname, 'newman')

const sendEmail = async (resp) => {
  //   const htmlReport = fs.readFileSync(
  //     '/Users/saieeash/Node js/revisino/newman/PostMan Course-2023-11-12-11-42-23-031-0.html',
  //     'utf8'
  //   )

  const filePath = path.join(
    folderPathToDelete,
    fs.readdirSync(path.join('newman'))[0]
  )

  console.log('filePath', filePath)

  const htmlReport = fs.readFileSync(filePath, 'utf8')

  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: 'liam49@ethereal.email',
      pass: 'aSvfDQBAKdKEcBJMcU',
    },
  })

  const info = await transporter.sendMail({
    from: '"Saieeash Reddy 👻" <saieeashreddy@gmail.com>', // sender address
    to: 'bar@example.com, baz@example.com, saieeashreddy1@gmail.com', // list of receivers
    subject: 'Automation Test Report', // Subject line
    html: 'See the attached HTML report for details.',
    attachments: [
      {
        filename: 'report.html',
        content: htmlReport,
      },
    ],
  })

  rimraf(folderPathToDelete)

  resp.json({ message: 'Email sent successfully', info: info })
}

module.exports = sendEmail
