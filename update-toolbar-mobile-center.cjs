const fs = require('fs');
let c = fs.readFileSync('src/components/BracketToolbar.tsx', 'utf8');

c = c.replace(
  'justify-between md:justify-end w-full',
  'justify-center gap-2 md:justify-end md:gap-0 w-full'
);

c = c.replace(
  'flex-col md:flex-row items-start md:items-center',
  'flex-col md:flex-row items-center md:items-center'
);

c = c.replace(
  '{/* Group 1: Bracket Size & Creation */}\n            <div className="flex items-center flex-wrap gap-2">',
  '{/* Group 1: Bracket Size & Creation */}\n            <div className="flex items-center justify-center flex-wrap gap-2">'
);

c = c.replace(
  '{/* Group 2: Layout & Filters */}\n            <div className="flex items-center flex-wrap gap-2">',
  '{/* Group 2: Layout & Filters */}\n            <div className="flex items-center justify-center flex-wrap gap-2">'
);

fs.writeFileSync('src/components/BracketToolbar.tsx', c);
