import { Parser } from 'csv-parse';

export function delay(ms: number) {
  return new Promise( resolve => setTimeout(resolve, ms) );
}

export const ready = (parser: Parser) => new Promise((resolve, reject) => {
  // wait for 15 seconds before throwing an error
  const timeout = setTimeout(() => reject("Timeout"), 15 * 1000)
  parser.on("readable", () => {
      clearTimeout(timeout)
      resolve("Stream ready")
  })
})