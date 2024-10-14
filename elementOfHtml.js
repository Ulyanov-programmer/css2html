import { createParser } from 'css-selector-parser'

const selectorParser = createParser()
const validVariableNamesForAttributes = [
  'attr',
  'attrs',
  'data',
]
const selfCloseTags = [
  'input',
  'br',
  'hr',
  'col',
  'link',
  'area',
  'img',
  'base',
  'embed',
  'keygen',
  'menuitem',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]

export class ElementOfHtml {
  #string = ''
  get string() {
    if (this.#string) return this.#string

    this.#addTextBefore()
    this.#createTagString()
    this.#addText()
    this.#addInnerElements()
    this.#createEndString()
    this.#addTextAfter()

    return this.#string
  }
  #selfCloseTag = false
  parentSelector = ''
  fullSelector
  selfSelector
  innerElements = []
  classes = []
  attributes = ''

  constructor(entryRule, selector) {
    this.fullSelector = selector

    this.#setParentAndSelfSelector(this.fullSelector)

    this.#parseSelector(selector)

    this.#setAttributes(entryRule)
    this.#setText(entryRule)
    this.#setTextFromComments(entryRule)
    this.#setTag()
    this.#setId()
    this.#setClasses()
  }

  #createTagString() {
    let endOfString = this.#selfCloseTag ? ' />' : ' >'

    this.#string +=
      '<' +
      this.tag +
      this.id +
      this.classes +
      this.attributes +
      endOfString
  }
  #addTextBefore() {
    this.#string += this.textBefore ? `${this.textBefore}` : ''
  }
  #addTextAfter() {
    this.#string += this.textAfter ? `${this.textAfter}\n` : '\n'
  }
  #addText() {
    this.#string += this.text ? `${this.text}` : ''
  }
  #addInnerElements() {
    if (this.innerElements.length > 0) {
      this.#string += '\n'
    }
    for (let innerElement of this.innerElements) {
      this.#string += innerElement.string
    }
  }
  #createEndString() {
    if (this.#selfCloseTag) return

    this.#string += '</' + this.tag + '>'
  }
  searchInnerElements(elements, searchIndex) {
    for (++searchIndex; searchIndex < elements.length; searchIndex++) {
      if (this.#isFirstLevelChild(elements[searchIndex])) {
        this.innerElements.push(elements[searchIndex])
      }
      else if (!this.#isInnerElement(elements[searchIndex])) {
        break
      }
    }
  }

  #setTag() {
    this.tag = this.tag ?? 'div'
    this.#selfCloseTag = selfCloseTags.includes(this.tag)
  }
  #setId() {
    this.id = this.id ? ` id="${this.id}"` : ''
  }
  #setClasses() {
    if (this.classes.length) {
      this.classes = ` class="` + this.classes.toString().replaceAll(',', ' ') + "\""
    }
    else {
      this.classes = ''
    }
  }
  #setAttributes(entryRule) {
    for (let decl of entryRule.declarations) {
      if (decl.type == 'comment') continue

      let declName = decl.property.split('-')

      if (validVariableNamesForAttributes.includes(declName[2])) {
        this.attributes += ' ' + this.#parseAttrVariable(decl)
      }
    }
  }
  #setText(entryRule) {
    this.text = entryRule.declarations.find(
      decl => decl.property == '--text'
    )?.value

    if (!this.text) return

    // Removing extra quotes
    let splittedText = this.text
      .split(',')
      .map(str => str.trim().slice(1, -1))

    switch (splittedText.length) {
      case 1:
        this.text = splittedText[0]
        break
      case 2:
        [this.text, this.textAfter] = splittedText
        break
      default:
        [this.textBefore, this.text, this.textAfter] = splittedText
        break
    }

    this.textBefore ??= entryRule.declarations.find(
      decl => decl.property == '--text-before'
    )
      ?.value.slice(1, -1)

    this.textAfter ??= entryRule.declarations.find(
      decl => decl.property == '--text-after'
    )
      ?.value.slice(1, -1)
  }
  #setTextFromComments(entryRule) {
    const replaceRegexp = / {1,}text(|-(before|after)): ?/

    for (let decl of entryRule.declarations) {
      let textDeclaration = decl?.comment?.match(/text-(before|after):|text:/i)?.at(0)

      if (!textDeclaration) continue

      let position = textDeclaration.toLowerCase().replace(':', '')
      let text = decl.comment.replace(replaceRegexp, '')
        // Removing one mandatory space at the end
        .slice(0, -1)

      switch (position) {
        case 'text':
          this.text = text
          break
        case 'text-before':
          this.textBefore = text
          break
        case 'text-after':
          this.textAfter = text
          break
      }
    }
  }
  #setParentAndSelfSelector(fullSelector) {
    let partsOfSelector = fullSelector.split(' ')

    if (partsOfSelector.length > 1) {
      this.parentSelector = partsOfSelector
        .filter((el, index) => index != partsOfSelector.length - 1)
        .join(' ')
    }

    this.selfSelector = partsOfSelector.at(-1)
  }

  #parseSelector(selector) {
    let lastNestedSelector = selector.split(' ').at(-1)
    let rule = selectorParser(lastNestedSelector)

    for (let item of rule.rules[0].items) {
      switch (item.type) {
        case 'TagName':
          this.tag = item.name
          break
        case 'ClassName':
          this.classes.push(item.name)
          break
        case 'Attribute':
          let value = item.value
            ? item?.operator + `"${item?.value?.value}"`
            : ''
          this.attributes += ' ' + item.name + value
          break
        case 'Id':
          this.id = item.name
          break
      }
    }
  }
  #parseAttrVariable(declaration) {
    let [type, name, value] = this.#getDeclarationData(declaration)

    switch (type) {
      case 'attr':
      case 'data':
        if (!value) { return name }

        return name + `="${value}"`

      case 'attrs':
        return value
    }
  }

  #isFirstLevelChild(element) {
    return element.fullSelector == `${this.fullSelector} ${element.selfSelector}`
  }
  #isInnerElement(element) {
    return element.parentSelector.startsWith(this.fullSelector)
  }
  #getDeclarationData(declaration) {
    let type = declaration.property.split('-')[2],
      name, value

    if (declaration.property.includes('--attr')) {
      name = declaration.property.replace('--attr-', '')
    }
    else if (declaration.property.includes('--data')) {
      name = declaration.property.replace('--', '')
    }

    if (/(")|(')|(`)/.test(declaration.value[0])) {
      // Removing nested quotes
      value = declaration.value.slice(1, -1)
    } else {
      value = declaration.value
    }

    return [type, name, value]
  }
}