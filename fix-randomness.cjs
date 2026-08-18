const fs = require('fs');
let c = fs.readFileSync('src/components/ManualDrawModal.tsx', 'utf8');

const regex = /let targetPool: number\[\] = \[\];[\s\S]*?if \(availableSlots\.length === 0\) \{[\s\S]*?alert\('Tidak ada slot kosong yang tersedia!'\);\s*return;\s*\}/;

const replacement = `
    const allSlots = Array.from({ length: bracketSize }, (_, i) => i);
    const allAvailableSlots = allSlots.filter(
      (s) => !occupiedInBracket.has(s) && !drawnSlots.has(s)
    );

    let targetPool: number[] = [];
    if (team.category === 'Seeded A') {
      targetPool = availableSeedPositions.slice(0, seededA.length);
    } else if (team.category === 'Seeded B') {
      targetPool = availableSeedPositions.slice(seededA.length, seededA.length + seededB.length);
    } else {
      targetPool = availableSeedPositions.slice(seededA.length + seededB.length);
    }

    let availableSlots = targetPool;

    if (availableSlots.length === 0) {
      availableSlots = allAvailableSlots;
    }

    if (availableSlots.length === 0) {
      alert('Tidak ada slot kosong yang tersedia!');
      return;
    }
`;

c = c.replace(regex, replacement.trim());

const regexInterval = /const randomDisplay = availableSlots\[Math\.floor\(Math\.random\(\) \* availableSlots\.length\)\];/;
const replacementInterval = `const randomDisplay = allAvailableSlots[Math.floor(Math.random() * allAvailableSlots.length)];`;

c = c.replace(regexInterval, replacementInterval);

fs.writeFileSync('src/components/ManualDrawModal.tsx', c);
