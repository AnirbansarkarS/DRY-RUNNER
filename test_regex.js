const code1 = 'for (int i = 0; i < N; i++) {';
const code2 = 'for(let i=0; i<3; i++) {';
const code3 = 'for (i=0; i<arr.length; i++)';

const regex = /for\s*\(\s*(?:int\s+|let\s+|var\s+|auto\s+|long\s+|short\s+|size_t\s+)?(\w+)\s*=\s*([^;]+)\s*;\s*\w+\s*(?:<|<=|>|>=|!=)\s*([^;]+)\s*;\s*[^)]+\s*\)\s*\{?[ \t]*/;

console.log(code1.match(regex));
console.log(code2.match(regex));
console.log(code3.match(regex));
