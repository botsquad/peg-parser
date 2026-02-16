const PEG = require('./peg_parser.js')

let passed = 0
let failed = 0

function assert(condition, message) {
  if (condition) {
    passed++
    console.log(`  PASS: ${message}`)
  } else {
    failed++
    console.log(`  FAIL: ${message}`)
  }
}

function assertParse(parser, input, expectedValue, message) {
  const result = parser(input, 0)
  if (!result.success) {
    failed++
    console.log(`  FAIL: ${message} — parse failed on "${input}"`)
    return
  }
  const actual = JSON.stringify(result.value)
  const expected = JSON.stringify(expectedValue)
  if (actual === expected) {
    passed++
    console.log(`  PASS: ${message}`)
  } else {
    failed++
    console.log(`  FAIL: ${message} — expected ${expected}, got ${actual}`)
  }
}

function assertFail(parser, input, message) {
  const result = parser(input, 0)
  if (!result.success) {
    passed++
    console.log(`  PASS: ${message}`)
  } else {
    failed++
    console.log(`  FAIL: ${message} — expected failure but got ${JSON.stringify(result.value)}`)
  }
}

// ============================================================
console.log('\n--- PEG.literal ---')
// ============================================================

assertParse(PEG.literal('hello'), 'hello world', 'hello',
  'literal matches exact string')

assertFail(PEG.literal('hello'), 'hi there',
  'literal fails on mismatch')

assertParse(PEG.literal(''), 'anything', '',
  'literal matches empty string')

// ============================================================
console.log('\n--- PEG.regex ---')
// ============================================================

assertParse(PEG.regex(/[0-9]+/), '123abc', '123',
  'regex matches digits')

assertFail(PEG.regex(/[0-9]+/), 'abc',
  'regex fails when no match at position')

assertParse(PEG.regex(/[a-z]+/i), 'Hello', 'Hello',
  'regex respects flags')

// ============================================================
console.log('\n--- PEG.seq ---')
// ============================================================

const helloWorld = PEG.seq(PEG.literal('hello'), PEG.literal(' '), PEG.literal('world'))
assertParse(helloWorld, 'hello world', ['hello', ' ', 'world'],
  'seq matches ordered sequence')

assertFail(PEG.seq(PEG.literal('hello'), PEG.literal('!')), 'hello world',
  'seq fails if any part fails')

// ============================================================
console.log('\n--- PEG.choice ---')
// ============================================================

const yesOrNo = PEG.choice(PEG.literal('yes'), PEG.literal('no'))
assertParse(yesOrNo, 'yes', 'yes',
  'choice matches first alternative')
assertParse(yesOrNo, 'no', 'no',
  'choice matches second alternative')
assertFail(yesOrNo, 'maybe',
  'choice fails if no alternative matches')

// Ordered choice: first match wins
const ab = PEG.choice(PEG.literal('ab'), PEG.literal('abc'))
assertParse(ab, 'abc', 'ab',
  'choice is ordered — first match wins')

// ============================================================
console.log('\n--- PEG.zeroOrMore ---')
// ============================================================

const digits = PEG.zeroOrMore(PEG.regex(/[0-9]/))
assertParse(digits, '123abc', ['1', '2', '3'],
  'zeroOrMore matches multiple')
assertParse(digits, 'abc', [],
  'zeroOrMore succeeds with zero matches')

// ============================================================
console.log('\n--- PEG.oneOrMore ---')
// ============================================================

const digits1 = PEG.oneOrMore(PEG.regex(/[0-9]/))
assertParse(digits1, '123abc', ['1', '2', '3'],
  'oneOrMore matches multiple')
assertFail(digits1, 'abc',
  'oneOrMore fails with zero matches')

// ============================================================
console.log('\n--- PEG.optional ---')
// ============================================================

const maybeSign = PEG.optional(PEG.literal('-'))
assertParse(maybeSign, '-5', '-',
  'optional matches when present')

{
  const result = maybeSign('5', 0)
  assert(result.success && result.value === null && result.pos === 0,
    'optional returns null and does not advance when absent')
}

// ============================================================
console.log('\n--- PEG.action ---')
// ============================================================

const number = PEG.action(
  PEG.regex(/[0-9]+/),
  (value) => parseInt(value, 10)
)
assertParse(number, '42rest', 42,
  'action transforms parsed value')

// ============================================================
console.log('\n--- PEG.lazy ---')
// ============================================================

// Recursive grammar: nested parentheses around a number
// expr = '(' expr ')' | number
const expr = PEG.lazy(() =>
  PEG.choice(
    PEG.action(
      PEG.seq(PEG.literal('('), expr, PEG.literal(')')),
      (parts) => parts[1]
    ),
    number
  )
)

assertParse(expr, '42', 42,
  'lazy: base case (number)')
assertParse(expr, '(42)', 42,
  'lazy: one level of nesting')
assertParse(expr, '((42))', 42,
  'lazy: two levels of nesting')

// ============================================================
console.log('\n--- Arithmetic expression parser ---')
// ============================================================

// Build a full arithmetic parser using the PEG combinators:
//   expr   = term (('+' | '-') term)*
//   term   = factor (('*' | '/') factor)*
//   factor = '(' expr ')' | number
//   number = [0-9]+

const ws = PEG.regex(/\s*/)

function token(parser) {
  return PEG.action(
    PEG.seq(ws, parser, ws),
    (parts) => parts[1]
  )
}

const num = token(PEG.action(PEG.regex(/[0-9]+/), v => parseInt(v, 10)))

const factor = PEG.lazy(() =>
  PEG.choice(
    PEG.action(
      PEG.seq(token(PEG.literal('(')), mathExpr, token(PEG.literal(')'))),
      (parts) => parts[1]
    ),
    num
  )
)

const term = PEG.action(
  PEG.seq(factor, PEG.zeroOrMore(PEG.seq(token(PEG.choice(PEG.literal('*'), PEG.literal('/'))), factor))),
  (parts) => {
    let result = parts[0]
    for (const [op, right] of parts[1]) {
      if (op === '*') result = result * right
      else result = result / right
    }
    return result
  }
)

const mathExpr = PEG.action(
  PEG.seq(term, PEG.zeroOrMore(PEG.seq(token(PEG.choice(PEG.literal('+'), PEG.literal('-'))), term))),
  (parts) => {
    let result = parts[0]
    for (const [op, right] of parts[1]) {
      if (op === '+') result = result + right
      else result = result - right
    }
    return result
  }
)

assertParse(mathExpr, '3 + 4', 7,
  'arithmetic: simple addition')
assertParse(mathExpr, '10 - 3', 7,
  'arithmetic: simple subtraction')
assertParse(mathExpr, '2 * 6', 12,
  'arithmetic: simple multiplication')
assertParse(mathExpr, '3 + 4 * 2', 11,
  'arithmetic: precedence (mul before add)')
assertParse(mathExpr, '(3 + 4) * 2', 14,
  'arithmetic: parentheses override precedence')
assertParse(mathExpr, '3 + 4 * (2 - 1)', 7,
  'arithmetic: complex expression')
assertParse(mathExpr, '100', 100,
  'arithmetic: single number')

// ============================================================
// Summary
// ============================================================

console.log(`\n=============================`)
console.log(`  ${passed} passed, ${failed} failed`)
console.log(`=============================\n`)

if (failed > 0) {
  process.exit(1)
}
