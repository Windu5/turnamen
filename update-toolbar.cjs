const fs = require('fs');
let c = fs.readFileSync('src/components/BracketToolbar.tsx', 'utf8');

c = c.replace('import { BracketLayoutMode } from', "import { Dices } from 'lucide-react';\nimport { BracketLayoutMode } from");
c = c.replace('onResetZoom: () => void;', 'onResetZoom: () => void;\n  onOpenManualDraw: () => void;');
c = c.replace('onResetZoom,', 'onResetZoom,\n  onOpenManualDraw,');

const btn = `        <button
          onClick={onOpenManualDraw}
          className="p-1.5 md:p-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded transition-colors"
          title="Cabut Undian Manual"
        >
          <Dices size={16} />
        </button>
        <div className="w-px h-6 bg-slate-700/50 mx-1"></div>
`;

c = c.replace('<div className="w-px h-6 bg-slate-700/50 mx-1"></div>', btn);
fs.writeFileSync('src/components/BracketToolbar.tsx', c);
