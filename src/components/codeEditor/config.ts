import * as monaco from "monaco-editor";

const sqlKeywords = [
  "USE",
  "SELECT",
  "FROM",
  "WHERE",
  "INSERT",
  "UPDATE",
  "DELETE",
  "CREATE",
  "ALTER",
  "DROP",
  "TABLE",
  "INDEX",
  "VIEW",
  "TRIGGER",
  "PROCEDURE",
  "FUNCTION",
  "DATABASE",
  "SCHEMA",
  "GRANT",
  "REVOKE",
  "JOIN",
  "INNER",
  "LEFT",
  "RIGHT",
  "FULL",
  "OUTER",
  "ON",
  "UNION",
  "GROUP BY",
  "HAVING",
  "ORDER BY",
  "ASC",
  "DESC",
  "LIMIT",
  "OFFSET",
  "IS NULL",
  "IS NOT NULL",
  "LIKE",
  "IN",
  "BETWEEN",
  "AND",
  "OR",
  "NOT",
  "EXISTS",
  "CASE",
  "WHEN",
  "THEN",
  "ELSE",
  "END",
  "AS",
  "DISTINCT",
  "ALL",
];

const sqlFunctions = [
  "COUNT",
  "SUM",
  "AVG",
  "MAX",
  "MIN",
  "ROUND",
  "UPPER",
  "LOWER",
  "CONCAT",
  "SUBSTRING",
  "DATE",
  "DATEADD",
  "DATEDIFF",
  "GETDATE",
  "CAST",
  "COALESCE",
  "NULLIF",
  "ISNULL",
];

const sqlOperators = ["=", "<>", "<", ">", "<=", ">=", "+", "-", "*", "/", "%"];

const tokenizerConfig:
  | monaco.languages.IMonarchLanguage
  | monaco.Thenable<monaco.languages.IMonarchLanguage> = {
  defaultToken: "",
  tokenPostfix: ".sql",
  ignoreCase: true,
  keywords: sqlKeywords,
  operators: sqlOperators,
  builtinFunctions: sqlFunctions,
  tokenizer: {
    root: [
      [
        /[a-zA-Z_]\w*/,
        {
          cases: {
            "@keywords": "keyword",
            "@builtinFunctions": "predefined",
            "@default": "identifier",
          },
        },
      ],
      { include: "@whitespace" },
      { include: "@numbers" },
      { include: "@strings" },
      { include: "@comments" },
      [/[;,.]/, "delimiter"],
      [/[(){}[\]]/, "@brackets"],
      [
        /[<>=!%&+\-*/|~^]/,
        { cases: { "@operators": "operator", "@default": "" } },
      ],
    ],
    whitespace: [[/\s+/, "white"]],
    comments: [
      [/--+.*/, "comment"],
      [/\/\*/, { token: "comment.quote", next: "@comment" }],
    ],
    comment: [
      [/[^*/]+/, "comment"],
      [/\*\//, { token: "comment.quote", next: "@pop" }],
      [/./, "comment"],
    ],
    numbers: [
      [/\d*\.\d+([eE][-+]?\d+)?/, "number.float"],
      [/0[xX][0-9a-fA-F*]/, "number.hex"],
      [/\d+/, "number"],
    ],
    strings: [
      [/'/, { token: "string", next: "@string" }],
      [/"/, { token: "string.double", next: "@stringDouble" }],
    ],
    string: [
      [/[^']+/, "string"],
      [/''/, "string"],
      [/'/, { token: "string", next: "@pop" }],
    ],
    stringDouble: [
      [/[^"]+/, "string.double"],
      [/""/, "string.double"],
      [/"/, { token: "string.double", next: "@pop" }],
    ],
  },
};

const themeConfig: monaco.editor.IStandaloneThemeData = {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "keyword", foreground: "#569CD6", fontStyle: "bold" },
    { token: "operator", foreground: "#D4D4D4" },
    { token: "string", foreground: "#CE9178" },
    { token: "string.double", foreground: "#CE9178" },
    { token: "number", foreground: "#B5CEA8" },
    { token: "comment", foreground: "#6A9955", fontStyle: "italic" },
    { token: "predefined", foreground: "#DCDCAA" },
    { token: "identifier", foreground: "#9CDCFE" },
    { token: "delimiter", foreground: "#D4D4D4" },
  ],
  colors: {
    "editor.background": "#1E1E1E",
    "editor.foreground": "#D4D4D4",
    "editorCursor.foreground": "#FFFFFF",
    "editor.lineHighlightBackground": "#2A2A2A",
    "editorLineNumber.foreground": "#858585",
  },
};

const languageConfig: monaco.languages.LanguageConfiguration = {
  wordPattern: /[a-zA-Z_]\w*/,
  autoClosingPairs: [
    { open: "(", close: ")" },
    { open: "'", close: "'", notIn: ["string", "comment"] },
    { open: '"', close: '"', notIn: ["string", "comment"] },
  ],
};

export {
  sqlKeywords,
  sqlOperators,
  sqlFunctions,
  tokenizerConfig,
  themeConfig,
  languageConfig,
};
