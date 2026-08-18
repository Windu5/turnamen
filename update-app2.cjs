const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');

c = c.replace('onOpenManualDraw={() => setIsManualDrawOpen(true)}\n', '');
c = c.replace(
  'onChangeFilter={setActiveFilter}',
  'onChangeFilter={setActiveFilter}\n          onOpenManualDraw={() => setIsManualDrawOpen(true)}'
);

fs.writeFileSync('src/App.tsx', c);
