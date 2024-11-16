import path from 'path'
import fs from 'fs'
import { CssToHtml } from '../cssToHtml.js'
import assert from 'assert'
import test from 'node:test'


const htmlFilePath = path.resolve(import.meta.dirname + '/helpers/test.html')
const cssFilePath = path.resolve(import.meta.dirname + '/helpers/test.css')

test('Writing code to a file should work.', () => {
  fs.writeFileSync(htmlFilePath, '')

  new CssToHtml({
    css: `div {}`,
    write: { in: htmlFilePath }
  })

  assert.equal(fs.readFileSync(htmlFilePath, 'utf8'), '<div></div>')
})

test('The code must be written after certain content.', () => {
  fs.writeFileSync(htmlFilePath,
    `<some-html-content>
  </some-html-content>`)

  new CssToHtml({
    css: `div {}`,
    write: {
      in: htmlFilePath,
      after: '<some-html-content>'
    }
  })

  assert.equal(
    fs.readFileSync(htmlFilePath, 'utf8'),
    `<some-html-content>
  <div></div>
`)
})

test('The code must be written before and after certain content.', () => {
  fs.writeFileSync(htmlFilePath,
    `<some-html-content>
  </some-html-content>`)
  new CssToHtml({
    css: `div {}`,
    write: {
      in: htmlFilePath,
      after: '<some-html-content>',
      before: '</some-html-content>'
    }
  })

  assert.equal(fs.readFileSync(htmlFilePath, 'utf8'),
    `<some-html-content>
  <div></div>
</some-html-content>`)
})

test('Empty CSS should not be processed.', () => {
  fs.writeFileSync(cssFilePath, '')

  assert.equal(
    new CssToHtml({
      css: fs.readFileSync(cssFilePath, 'utf8'),
    }).outputHTML,

    undefined
  )
})

test('The code from the CSS file must be processed.', () => {
  fs.writeFileSync(cssFilePath, 'div {} div span { /* {{text}} */ }')

  assert.equal(
    new CssToHtml({
      css: fs.readFileSync(cssFilePath, 'utf8'),
    }).outputHTML,

    `<div>
  <span>text</span>
</div>`)
})



test('Temporary data has been deleted from files', () => {
  fs.writeFileSync(htmlFilePath, '')
  fs.writeFileSync(cssFilePath, '')
})