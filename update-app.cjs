const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');

if (!c.includes('ManualDrawModal')) {
  c = c.replace(
    "import { LiveDrawModal } from './components/LiveDrawModal';",
    "import { LiveDrawModal } from './components/LiveDrawModal';\nimport { ManualDrawModal } from './components/ManualDrawModal';"
  );
  
  c = c.replace(
    'const [isLiveDrawOpen, setIsLiveDrawOpen] = useState(false);',
    'const [isLiveDrawOpen, setIsLiveDrawOpen] = useState(false);\n  const [isManualDrawOpen, setIsManualDrawOpen] = useState(false);'
  );
  
  const handleLiveDrawRegex = /const handleApplyLiveDraw = \([\s\S]*?setTimeout\(\(\) => calculateFitToScreen\(\), 50\);\n  };/;
  
  const handleManualDraw = `
  const handleApplyManualDraw = (results: Record<string, number>) => {
    let updated = rounds.map(r => r.map(m => ({ ...m, schedule: { ...m.schedule } })));
    Object.entries(results).forEach(([teamId, slotIndex]) => {
      const mIdx = Math.floor(slotIndex / 2);
      const prop = slotIndex % 2 === 0 ? 't1' : 't2';
      const team = teams.find(t => t.id === teamId) || null;
      if (updated[0] && updated[0][mIdx]) {
        updated[0][mIdx][prop] = team;
      }
    });

    // Auto advance BYEs
    if (updated.length > 0) {
      for (let m = 0; m < updated[0].length; m++) {
        const match = updated[0][m];
        if (match.t1?.id === 'BYE' && match.t2 && match.t2.id !== 'BYE') {
          updated = selectWinnerInRounds(updated, 0, m, 't2');
        } else if (match.t2?.id === 'BYE' && match.t1 && match.t1.id !== 'BYE') {
          updated = selectWinnerInRounds(updated, 0, m, 't1');
        }
      }
    }
    
    setRounds(updated);
    setActiveTab('bagan');
  };
`;
  c = c.replace(handleLiveDrawRegex, match => match + handleManualDraw);

  c = c.replace(
    'onOpenLiveDraw={() => setIsLiveDrawOpen(true)}',
    'onOpenLiveDraw={() => setIsLiveDrawOpen(true)}\n          onOpenManualDraw={() => setIsManualDrawOpen(true)}'
  );
  
  const modalRegex = /<LiveDrawModal[\s\S]*?\/>/;
  const manualModal = `
      <ManualDrawModal
        isOpen={isManualDrawOpen}
        onClose={() => setIsManualDrawOpen(false)}
        teams={teams}
        bracketSize={bracketSize}
        rounds={rounds}
        onApplyDraw={handleApplyManualDraw}
      />
`;
  c = c.replace(modalRegex, match => match + manualModal);

  fs.writeFileSync('src/App.tsx', c);
}
