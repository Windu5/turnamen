const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `onChangeFilter={setActiveFilter}
                onRequestResetBracket={handleResetBracket}`;

const replacementStr = `onChangeFilter={setActiveFilter}
                onOpenManualDraw={() => setIsManualDrawOpen(true)}
                onRequestResetBracket={handleResetBracket}`;

c = c.replace(targetStr, replacementStr);
fs.writeFileSync('src/App.tsx', c);
