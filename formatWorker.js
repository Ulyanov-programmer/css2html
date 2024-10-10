import { runAsWorker } from 'synckit'
import * as prettier from "prettier"

runAsWorker(async (newContent) => {
  return prettier.format(newContent, { parser: "html" })
})