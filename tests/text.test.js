import { CssToHtml } from '../cssToHtml.js'
import assert from 'assert'
import test from 'node:test'

test('The text inside the tag must be processed', () => {
  assert.equal(
    new CssToHtml({
      css: `div { /* {{inner text}} */ }`,
    })
      .outputHTML,

    `<div>inner text</div>\n`
  )
})
test('The text before the tag must be processed', () => {
  assert.equal(
    new CssToHtml({
      css: `div { /* before text{{}} */ }`,
    })
      .outputHTML,

    `before text<div></div>\n`
  )
})
test('The text after the tag must be processed', () => {
  assert.equal(
    new CssToHtml({
      css: `div { /* {{}}after text */ }`,
    })
      .outputHTML,

    `<div></div>after text\n`
  )
})
test('The text without additional spaces should be saved without spaces.', () => {
  assert.equal(
    new CssToHtml({
      css: `div { /* before text{{inner text}}after text */ }`,
    })
      .outputHTML,

    `before text<div>inner text</div>after text\n`
  )
})
test('The text with additional spaces should keep them.', () => {
  assert.match(
    new CssToHtml({
      css:
        `div { /*  before text  {{  inner text }}  after text  */ }`,
    })
      .outputHTML,

    / +before text +<div> +inner text +<\/div> +after text[\n]/,
  )
})
test('The text should be processed along with the new lines.', () => {
  assert.equal(
    new CssToHtml({
      css: `
div { /* 
    before 1
    before 2
  {{
    inner 1
    inner 2
    inner 3
  }}after 1
    after 2 
*/ }`,
    })
      .outputHTML,

    `
before 1
before 2
<div>
  inner 1
  inner 2
  inner 3
</div>after 1
after 2
`,
  )
})
