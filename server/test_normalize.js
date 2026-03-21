const normalizeCppCode = (code) => {
  if (!code) return '';
  let normalized = code;

  normalized = normalized.replace(/\/\/.*$/gm, '');
  normalized = normalized.replace(/\/\*[\s\S]*?\*\//g, '');

  normalized = normalized.replace(/'[^']*'/g, "'x'");
  normalized = normalized.replace(/"[^"]*"/g, '"x"');

  normalized = normalized.replace(/<</g, ' << ');
  normalized = normalized.replace(/>>/g, ' >> ');
  normalized = normalized.replace(/<=/g, ' <= ');
  normalized = normalized.replace(/>=/g, ' >= ');
  normalized = normalized.replace(/==/g, ' == ');
  normalized = normalized.replace(/!=/g, ' != ');
  normalized = normalized.replace(/&&/g, ' && ');
  normalized = normalized.replace(/\|\|/g, ' || ');

  const cppKeywords = [
    'int', 'char', 'float', 'double', 'bool', 'void', 'long', 'short', 'unsigned', 'signed',
    'const', 'static', 'extern', 'register', 'volatile', 'auto',
    'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default', 'break', 'continue', 'return', 'goto',
    'struct', 'class', 'union', 'enum', 'typedef', 'sizeof',
    'public', 'private', 'protected', 'virtual', 'override', 'final',
    'new', 'delete', 'this', 'nullptr', 'true', 'false',
    'namespace', 'using', 'template', 'typename', 'try', 'catch', 'throw',
    'cout', 'cin', 'endl', 'std', 'include', 'define', 'iostream', 'vector', 'string', 'map', 'set'
  ];

  normalized = normalized.replace(/[a-zA-Z_][a-zA-Z0-9_]*/g, (match) => {
    return cppKeywords.includes(match) ? match : 'VAR';
  });

  normalized = normalized.replace(/[0-9]+(\.[0-9]+)?/g, 'NUM');

  normalized = normalized.replace(/\s+/g, ' ').trim();

  return normalized.toLowerCase();
};

console.log('Testing normalizeCppCode:');
console.log('');

const testCases = [
  ['cout << a;', 'cout << a;'],
  ['cout<<a;', 'cout << a;'],
  ['cout  <<  a;', 'cout << a;'],
  ['inta', 'int a'],
  ['int b', 'int var'],
];

testCases.forEach(([input, expected]) => {
  const result = normalizeCppCode(input);
  console.log('Input:', JSON.stringify(input));
  console.log('Expected:', JSON.stringify(expected));
  console.log('Output:', JSON.stringify(result));
  console.log('Match:', result === expected ? 'OK' : 'FAIL');
  console.log('---');
});

const userAnswer = 'cout << a;';
const correctAnswer = 'cout << a;';
console.log('Direct comparison:');
console.log('User:', normalizeCppCode(userAnswer));
console.log('Correct:', normalizeCppCode(correctAnswer));
console.log('Equal:', normalizeCppCode(userAnswer) === normalizeCppCode(correctAnswer) ? 'OK' : 'FAIL');
