const fs = require('fs');
let c = fs.readFileSync('src/components/Navigation.tsx', 'utf8');

c = c.replace('onOpenLiveDraw, onOpenManualDraw,', 'onOpenLiveDraw,');
c = c.replace(/\{onOpenManualDraw && \([\s\S]*?Cabut Undian Manual[\s\S]*?<\/button>\s*\)\}/, '');
c = c.replace('onOpenManualDraw?: () => void;', '');
fs.writeFileSync('src/components/Navigation.tsx', c);
