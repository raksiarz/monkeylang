export type TokenType = string;

export type Token = {
  type: TokenType,
  literal: string,
};

const ILLEGAL = "ILLEGAL";
const EOF = "EOF";
const IDENT = "";
const INT = "INT" ;
const ASSIGN = "=";
const PLUS = "+";
const COMMA = ",";
const SEMICOLON = ";";
const LPAREN = "(";
const RPAREN = ")";
const LBRACE = "{";
const RBRACE = "}";
const FUNCTION = "FUNCTION";
const LET = "LET";
const TRUE = "TRUE";
const FALSE = "FALSE";
const IF = "IF";
const ELSE = "ELSE";
const RETURN = "RETURN";
const MINUS = "-";
const BANG = "!";
const ASTERISK = "*";
const SLASH = "/";
const LT = "<";
const GT = ">";
const EQ = "=="
const NOT_EQ = "!="

const KEYWORDS = new Map<string, TokenType>([
  ["fn", FUNCTION],
  ["let", LET],
  ["true", TRUE],
  ["false", FALSE],
  ["if", IF],
  ["else", ELSE],
  ["return", RETURN],
]);

// Lexer 
export interface Lexer {
  input: string,
  position: number,
  readPosition: number,
  ch: Uint8Array,
};

function isLetter(ch: Uint8Array): boolean {
  return 97 <= ch[0] && ch[0] <= 122 || 65 <= ch[0] && ch[0] <= 90 || ch[0] === 95;
}

function isDigit(ch: Uint8Array): boolean {
  return 48 <= ch[0] && ch[0] <= 57;
}

function lookupIdent(ident: string): TokenType {
  const tok = KEYWORDS.get(ident)
  if(!!tok) {
    return tok
  }
  return IDENT
}

class LexerImpl implements Lexer {
  input: string;
  position: number;
  readPosition: number;
  ch: Uint8Array;

  constructor(input:  string) {
    this.input = input;
    this.readPosition = 0
    this.readChar()
  };

  readChar = () => {
    if (this.readPosition >= this.input.length) {
      this.ch = new Uint8Array(0);
    } else {
      this.ch = new TextEncoder().encode(this.input[this.readPosition]);
    };
    this.position = this.readPosition;
    this.readPosition += 1;
  };

  nextToken = (): Token => {
    let tok = <Token>{};

    this.skipWhitespace()

    switch (new TextDecoder().decode(this.ch)) {
      case '=': {
        const peek = new TextDecoder().decode(this.peekChar())
        if(peek === '=') {
          const char = new TextDecoder().decode(this.ch)
          this.readChar
          tok = { type: EQ, literal: char + peek }
        } else {
          tok = this.newToken(ASSIGN, this.ch);
        }
        break;
      }
      case ';':
        tok = this.newToken(SEMICOLON, this.ch);
        break;
      case '(':
        tok = this.newToken(LPAREN, this.ch);
        break;
      case ')':
        tok = this.newToken(RPAREN, this.ch);
        break;
      case ',':
        tok = this.newToken(COMMA, this.ch);
        break;
      case '+':
        tok = this.newToken(PLUS, this.ch);
        break;
      case '{':
        tok = this.newToken(LBRACE, this.ch);
        break;
      case '}':
        tok = this.newToken(RBRACE, this.ch);
        break;
      case '-':
        tok = this.newToken(MINUS, this.ch);
        break;
      case '*':
        tok = this.newToken(ASTERISK, this.ch);
        break;
      case '/':
        tok = this.newToken(SLASH, this.ch);
        break;
      case '!': {
        const peek = new TextDecoder().decode(this.peekChar())
        if(peek === '=') {
          const char = new TextDecoder().decode(this.ch)
          this.readChar
          tok = { type: NOT_EQ, literal: char + peek }
        } else {
          tok = this.newToken(BANG, this.ch);
        }
        break;
      }
      case '<':
        tok = this.newToken(LT, this.ch);
        break;
      case '>':
        tok = this.newToken(GT, this.ch);
        break;
      case '':
        tok.literal = "";
        tok.type = EOF;
        break;
      default:
        if(isLetter(this.ch)) {
          tok.literal = this.readIdentifier()
          tok.type = lookupIdent(tok.literal)
          return tok
        } else if(isDigit(this.ch)) {
          tok.type = INT
          tok.literal = this.readNumber()
          return tok
        }
        tok = this.newToken(ILLEGAL, this.ch)
        break;
    };

    this.readChar();
    return tok
  };

  newToken = (token: TokenType, ch: Uint8Array): Token => {
    return { type: token, literal: new TextDecoder().decode(ch) };
  };

  readIdentifier = (): Token["literal"] => {
    const position = this.position
    while(isLetter(this.ch)) {
      this.readChar()
    }
    return this.input.slice(position, this.position)
  }

  readNumber = (): Token["literal"] => {
    const position = this.position
    while(isDigit(this.ch)) {
      this.readChar()
    }
    return this.input.slice(position, this.position)
  }

  skipWhitespace = (): void => {
    while(this.ch[0] === 32 || this.ch[0] === 10 || this.ch[0] === 9 || this.ch[0] === 13) { 
      this.readChar()
    }
  }

  peekChar = (): Uint8Array => {
    if(this.readPosition >= this.input.length) {
      return new Uint8Array(0)
    } else {
      return new TextEncoder().encode(this.input[this.readPosition])
    }
  }
};

export default LexerImpl
