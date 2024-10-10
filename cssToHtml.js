import fs from 'fs-extra'
import path from 'path'
import { createSyncFn } from 'synckit'
import { parse } from '@adobe/css-tools'
import { createParser } from 'css-selector-parser'
import { ElementOfHtml } from './elementOfHtml.js'

const syncFormatting = createSyncFn(path.resolve('./formatWorker.js'))

export class CssToHtml {
  static ENCODING = 'utf8'
  static SELECTOR_PARSER = createParser({ syntax: 'progressive' })
  static UNACCEPTABLE_SELECTORS = [
    'WildcardTag',
    'PseudoElement',
    'PseudoClass',
    ':',
    '*',
    '+',
    '>',
    '||',
    '~',
    '|',
  ]
  #pathToHTML
  #html
  #css
  #astRules
  #elements = []
  #writeBefore
  #writeAfter
  #writeInFile = false
  outputHTML

  constructor({ css, write, format = true, }) {
    this.#css = css
    this.format = format

    if (write?.in) {
      this.#pathToHTML = path.normalize(write.in)

      if (!fs.existsSync(this.#pathToHTML)) {
        console.error(`The ${this.#pathToHTML} file was not found, so it will be created.`)
        fs.createFileSync(this.#pathToHTML)
      }

      this.#writeInFile = true
      this.#html = fs.readFileSync(this.#pathToHTML, CssToHtml.ENCODING)
      this.#writeAfter = write?.after
      this.#writeBefore = write?.before
    }

    let astRules = parse(this.#css).stylesheet.rules

    if (!astRules.length)
      return

    this.#filterAstRules(astRules)

    this.#initHTMLElements()
    this.#createHTMLStructure()

    if (!this.#elements.length) return

    this.outputHTML = this.#prepareHtml()

    if (this.#writeInFile) {
      fs.writeFileSync(write.in, this.outputHTML)
    }
  }

  #filterAstRules(astRules) {
    this.#astRules = astRules.filter(
      rule => {
        if (
          rule.type != 'rule' ||
          this.#containsUnacceptableSelector(rule.selectors[0])
        )
          return false

        return true
      }
    )
  }
  #initHTMLElements() {
    for (let rule of this.#astRules) {
      this.#elements.push(new ElementOfHtml(rule, rule.selectors[0]))
    }
  }
  #createHTMLStructure() {
    for (let i = 0; i < this.#elements.length; i++) {
      this.#elements[i].searchInnerElements(this.#elements, i)
    }

    this.#elements = this.#elements.filter(el => el.parentSelector == '')
  }
  #prepareHtml() {
    let newContent = ''
    let [contentStartIndex, contentEndIndex] = this.#getWritingStartAndEndIndex()

    if (this.#writeInFile) {
      newContent = this.#html.substring(0, contentStartIndex)

      for (let element of this.#elements) {
        newContent += element.string + '\n'
      }

      newContent += this.#html.substring(contentEndIndex)
    }
    else {
      for (let element of this.#elements) {
        newContent += element.string + '\n'
      }
    }

    if (this.format) {
      return syncFormatting(newContent)
    } else {
      return newContent
    }
  }
  #containsUnacceptableSelector(selector) {
    return CssToHtml.UNACCEPTABLE_SELECTORS.some(
      unSelector => selector.includes(unSelector)
    )
  }
  #getWritingStartAndEndIndex() {
    if (!this.#writeInFile) return [0, 0]


    let contentStartIndex = 0, contentEndIndex = this.#html.length

    if (this.#writeAfter) {
      contentStartIndex = this.#html.indexOf(this.#writeAfter)
    }
    if (this.#writeBefore) {
      contentEndIndex = this.#html.lastIndexOf(this.#writeBefore)
    }

    if (contentStartIndex == -1 || contentEndIndex == -1) {
      throw new Error(`contentStartIndex or contentEndIndex was not found in the file ${this.#pathToHTML}!`)
    }

    contentStartIndex += this.#writeAfter?.length ?? 0

    return [contentStartIndex, contentEndIndex]
  }
}