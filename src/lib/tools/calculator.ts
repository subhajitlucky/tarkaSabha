import { ToolDefinition, readString, toolError, toolOk } from './types'

/**
 * Arithmetic evaluator.
 *
 * Deliberately a hand-written recursive-descent parser rather than eval() or
 * new Function(): model-authored strings must never reach a JavaScript
 * evaluator. Only numbers, the operators below, a fixed function set and two
 * constants are reachable.
 */

const MAX_EXPRESSION_LENGTH = 500
const MAX_DEPTH = 32

const CONSTANTS: Record<string, number> = {
  pi: Math.PI,
  e: Math.E,
}

type Fn = (...args: number[]) => number

const FUNCTIONS: Record<string, { arity: number | 'variadic'; fn: Fn }> = {
  sqrt: { arity: 1, fn: Math.sqrt },
  abs: { arity: 1, fn: Math.abs },
  round: { arity: 1, fn: Math.round },
  floor: { arity: 1, fn: Math.floor },
  ceil: { arity: 1, fn: Math.ceil },
  ln: { arity: 1, fn: Math.log },
  log10: { arity: 1, fn: Math.log10 },
  exp: { arity: 1, fn: Math.exp },
  min: { arity: 'variadic', fn: (...xs) => Math.min(...xs) },
  max: { arity: 'variadic', fn: (...xs) => Math.max(...xs) },
}

class Parser {
  private pos = 0
  private depth = 0

  constructor(private readonly src: string) {}

  parse(): number {
    const value = this.parseExpression()
    this.skipSpace()
    if (this.pos < this.src.length) {
      throw new Error(`Unexpected "${this.src[this.pos]}" at position ${this.pos + 1}`)
    }
    if (!Number.isFinite(value)) {
      throw new Error('Result is not a finite number')
    }
    return value
  }

  private skipSpace() {
    while (this.pos < this.src.length && /\s/.test(this.src[this.pos])) this.pos++
  }

  private peek(): string | null {
    this.skipSpace()
    return this.pos < this.src.length ? this.src[this.pos] : null
  }

  private eat(char: string): boolean {
    if (this.peek() === char) {
      this.pos++
      return true
    }
    return false
  }

  private parseExpression(): number {
    this.depth++
    if (this.depth > MAX_DEPTH) throw new Error('Expression is nested too deeply')

    let left = this.parseTerm()
    for (;;) {
      const next = this.peek()
      if (next === '+') {
        this.pos++
        left += this.parseTerm()
      } else if (next === '-') {
        this.pos++
        left -= this.parseTerm()
      } else {
        break
      }
    }

    this.depth--
    return left
  }

  private parseTerm(): number {
    let left = this.parseUnary()
    for (;;) {
      const next = this.peek()
      if (next === '*') {
        this.pos++
        left *= this.parseUnary()
      } else if (next === '/') {
        this.pos++
        const divisor = this.parseUnary()
        if (divisor === 0) throw new Error('Division by zero')
        left /= divisor
      } else if (next === '%') {
        this.pos++
        const divisor = this.parseUnary()
        if (divisor === 0) throw new Error('Modulo by zero')
        left %= divisor
      } else {
        break
      }
    }
    return left
  }

  private parseUnary(): number {
    if (this.eat('-')) return -this.parseUnary()
    if (this.eat('+')) return this.parseUnary()
    return this.parsePower()
  }

  private parsePower(): number {
    const base = this.parsePrimary()
    if (this.peek() === '^') {
      this.pos++
      // Right-associative, and the exponent may itself be unary.
      const exponent = this.parseUnary()
      return Math.pow(base, exponent)
    }
    return base
  }

  private parsePrimary(): number {
    if (this.eat('(')) {
      const value = this.parseExpression()
      if (!this.eat(')')) throw new Error('Missing closing parenthesis')
      return value
    }

    this.skipSpace()
    const rest = this.src.slice(this.pos)

    const numberMatch = rest.match(/^\d+(\.\d+)?([eE][+-]?\d+)?/)
    if (numberMatch) {
      this.pos += numberMatch[0].length
      return Number(numberMatch[0])
    }

    const nameMatch = rest.match(/^[a-zA-Z_][a-zA-Z0-9_]*/)
    if (!nameMatch) {
      throw new Error(`Expected a number, name, or "(" at position ${this.pos + 1}`)
    }

    const name = nameMatch[0]
    this.pos += name.length
    const lower = name.toLowerCase()

    if (this.peek() === '(') {
      this.pos++
      const args: number[] = []
      if (!this.eat(')')) {
        for (;;) {
          args.push(this.parseExpression())
          if (this.eat(',')) continue
          if (this.eat(')')) break
          throw new Error(`Missing ")" after arguments to ${name}`)
        }
      }

      const entry = FUNCTIONS[lower]
      if (!entry) throw new Error(`Unknown function "${name}"`)
      if (entry.arity !== 'variadic' && args.length !== entry.arity) {
        throw new Error(`${name}() takes ${entry.arity} argument(s), got ${args.length}`)
      }
      if (entry.arity === 'variadic' && args.length === 0) {
        throw new Error(`${name}() needs at least one argument`)
      }
      return entry.fn(...args)
    }

    if (lower in CONSTANTS) return CONSTANTS[lower]
    throw new Error(`Unknown name "${name}"`)
  }
}

export function evaluateExpression(expression: string): number {
  if (expression.length > MAX_EXPRESSION_LENGTH) {
    throw new Error(`Expression is too long (max ${MAX_EXPRESSION_LENGTH} characters)`)
  }
  return new Parser(expression).parse()
}

export const calculatorTool: ToolDefinition = {
  label: 'Calculator',
  summary: 'Evaluate arithmetic exactly',
  schema: {
    name: 'calculator',
    description:
      'Evaluate an arithmetic expression exactly. Use this instead of doing mental arithmetic. Supports + - * / % ^, parentheses, and sqrt, abs, round, floor, ceil, ln, log10, exp, min, max, plus the constants pi and e.',
    parameters: {
      type: 'object',
      properties: {
        expression: {
          type: 'string',
          description: 'The expression to evaluate, e.g. "(1250000 * 0.07) / 12"',
        },
      },
      required: ['expression'],
    },
  },
  async run(input) {
    const expression = readString(input, 'expression')
    if (!expression) return toolError('expression is required')

    try {
      const value = evaluateExpression(expression)
      return toolOk(`${expression} = ${value}`)
    } catch (error) {
      return toolError(error instanceof Error ? error.message : 'Could not evaluate expression')
    }
  },
}
