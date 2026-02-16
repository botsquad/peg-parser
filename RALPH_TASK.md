---
task: Build a simple PEG parser library in JavaScript
test_command: "node test_parser.js"
---

# Task: Build a simple PEG parser

Create a simple, modular PEG (Parsing Expression Grammar) parser library in a single file `peg_parser.js`. The parser should be able to define grammars declaratively and parse input strings into ASTs (Abstract Syntax Trees).

The library must support the core PEG operators and be tested by the provided `test_parser.js` file.

## Requirements

The `peg_parser.js` file should export a `PEG` object with the following grammar-building functions:

- `PEG.literal(str)` — matches an exact string
- `PEG.regex(pattern)` — matches a regex pattern (anchored at current position)
- `PEG.seq(...parsers)` — ordered sequence: all must match in order
- `PEG.choice(...parsers)` — ordered choice: tries each parser in order, returns first match
- `PEG.zeroOrMore(parser)` — matches zero or more repetitions (greedy)
- `PEG.oneOrMore(parser)` — matches one or more repetitions (greedy)
- `PEG.optional(parser)` — matches zero or one occurrence
- `PEG.action(parser, fn)` — applies a transform function to the parser's result
- `PEG.lazy(fn)` — for recursive grammars; `fn` returns a parser (called lazily)

Each parser is a function `parse(input, pos) => { success, value, pos }` where:
- `success` is a boolean
- `value` is the parsed result (string, array, or transformed value)
- `pos` is the new position after the match

The module should use `module.exports = PEG` so it can be required from Node.js.

## Success Criteria

- [ ] File `peg_parser.js` exists and exports the `PEG` object
- [ ] `PEG.literal` matches exact strings and fails on mismatches
- [ ] `PEG.regex` matches regex patterns at the current position
- [ ] `PEG.seq` matches an ordered sequence of parsers
- [ ] `PEG.choice` tries alternatives in order and returns the first match
- [ ] `PEG.zeroOrMore` matches zero or more repetitions
- [ ] `PEG.oneOrMore` matches one or more repetitions (fails on zero)
- [ ] `PEG.optional` matches zero or one occurrence
- [ ] `PEG.action` transforms parser results with a callback
- [ ] `PEG.lazy` supports recursive grammar definitions
- [ ] An arithmetic expression parser can be built using the library (parses `3 + 4 * (2 - 1)` into a correct AST)
- [ ] All tests in `test_parser.js` pass when run with `node test_parser.js`

## Ralph Instructions

1. Read `test_parser.js` to understand the expected API and test cases.
2. Create `peg_parser.js` implementing all PEG combinators described above.
3. Each combinator should return a parser function with signature `(input, pos) => { success, value, pos }`.
4. Run `node test_parser.js` to verify all tests pass.
5. If any tests fail, read the error output, fix the implementation, and re-run.
6. When all tests pass, update each `[ ]` checkbox above to `[x]`.
7. When complete, output `<ralph>COMPLETE</ralph>`
