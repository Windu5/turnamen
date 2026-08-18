const fs = require('fs');
let c = fs.readFileSync('src/components/BracketToolbar.tsx', 'utf8');

const regex = /(<RotateCcw size=\{15\} \/>\s*<\/button>)/;
const btn = `$1
            <div className="w-px h-6 bg-slate-700 mx-1"></div>
            <button
              type="button"
              onClick={onOpenManualDraw}
              className="p-1.5 bg-indigo-500/10 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-400 rounded-lg transition-colors cursor-pointer"
              title="Cabut Undian Manual"
            >
              <Dices size={15} />
            </button>`;

c = c.replace(regex, btn);
fs.writeFileSync('src/components/BracketToolbar.tsx', c);
