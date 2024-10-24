import { CssToHtml } from '../cssToHtml.js'
import assert from 'assert'
import test from 'node:test'

test('The text without additional spaces should be saved without spaces.', () => {
  assert.equal(
    new CssToHtml({
      css:
        `div { /* 
            @before before text @inside inner text @after after text  
        */ }`,
    })
      .outputHTML,

    `before text<div>inner text</div>after text
`
  )
})
test('The text with additional spaces should keep them.', () => {
  assert.match(
    new CssToHtml({
      css:
        `div { /* 
            @before  before text  @inside  inner text  @after  after text  
        */ }`,
    })
      .outputHTML,

    / +before text +<div> +inner text +<\/div> +after text[\n]/,
  )
})
test('The text should be saved from different comments.', () => {
  assert.equal(
    new CssToHtml({
      css:
        `div { /* 
            @before before text @inside inner text @after after text  
        */
        /* 
          @inside inner text
        */
        /* 
          @after after text  
        */
}`,
    })
      .outputHTML,

    `before text<div>inner text
</div>after text
`,
  )
})
test('The text should be processed along with the new lines.', () => {
  assert.equal(
    new CssToHtml({
      css: `
div { /* 
  @before before 1
    before 2
  @inside
    inner 1
    inner 2
    inner 3 
  @after after 1
    after 2 
*/ }`,
    })
      .outputHTML,

    `before 1
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
