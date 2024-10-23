import path from 'path'
import fs from 'fs'
import { CssToHtml } from '../cssToHtml.js'
import assert from 'assert'


const htmlFilePath = path.resolve(import.meta.dirname + '/helpers/test.html')
const cssFilePath = path.resolve(import.meta.dirname + '/helpers/test.css')

new CssToHtml({
  css: `div {}`,
  write: { in: htmlFilePath }
})
assert.equal(
  fs.readFileSync(htmlFilePath, 'utf8'), '<div></div>\n',
  'Writing code to a file should work.'
)


fs.writeFileSync(htmlFilePath,
  `<some-html-content>
  </some-html-content>
`)
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
`,
  'The code must be written after certain content.'
)


fs.writeFileSync(htmlFilePath,
  `<some-html-content>
  </some-html-content>
`)
new CssToHtml({
  css: `div {}`,
  write: {
    in: htmlFilePath,
    after: '<some-html-content>',
    before: '</some-html-content>'
  }
})
assert.equal(
  fs.readFileSync(htmlFilePath, 'utf8'),
  `<some-html-content>
  <div></div>
</some-html-content>
`,
  'The code must be written before and after certain content.'
)


fs.writeFileSync(cssFilePath, '')
assert.equal(
  new CssToHtml({
    css: fs.readFileSync(cssFilePath, 'utf8'),
  }).outputHTML,

  undefined,

  'Empty CSS should not be processed.'
)


fs.writeFileSync(cssFilePath, 'div {} div span { /* @inside text */ }')
assert.equal(
  new CssToHtml({
    css: fs.readFileSync(cssFilePath, 'utf8'),
  }).outputHTML,

  `<div>
  <span>text</span>
</div>
`,

  'The code from the CSS file must be processed.'
)



fs.writeFileSync(htmlFilePath, '')
fs.writeFileSync(cssFilePath, '')