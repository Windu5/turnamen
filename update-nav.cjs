const fs = require('fs');
let c = fs.readFileSync('src/components/Navigation.tsx', 'utf8');

// Update destructuring
c = c.replace('onOpenLiveDraw,', 'onOpenLiveDraw, onOpenManualDraw,');

// Import icon
if (!c.includes('Dices')) {
  c = c.replace('Shuffle,', 'Shuffle, Dices,');
}

// Add button
const btnRegex = /(\{onOpenLiveDraw && \([\s\S]*?<\/button>\s*\)\})/;
const manualBtn = `\n            {onOpenManualDraw && (
              <button
                onClick={() => { onOpenManualDraw(); setIsMenuOpen(false); }}
                className="px-4 py-2.5 text-left text-sm font-semibold text-slate-300 hover:bg-slate-700/50 hover:text-indigo-400 flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Dices size={16} /> Cabut Undian Manual
              </button>
            )}`;

c = c.replace(btnRegex, `$1${manualBtn}`);
fs.writeFileSync('src/components/Navigation.tsx', c);
