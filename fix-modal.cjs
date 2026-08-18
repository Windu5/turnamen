const fs = require('fs');
let c = fs.readFileSync('src/components/ManualDrawModal.tsx', 'utf8');

const regex = /const seededA = teams\.filter[\s\S]*?if \(availableSlots\.length === 0\) \{/;

const replacement = `
    const occupiedByBracket = getOccupiedSlots();
    
    // Find how many teams of each category still need to be drawn
    const availableTeams = getAvailableTeams();
    const seededA = availableTeams.filter((t) => t.category === 'Seeded A');
    const seededB = availableTeams.filter((t) => t.category === 'Seeded B');

    const availableSeedPositions = seedPositions.filter(
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
`;

c = c.replace(regex, replacement);
fs.writeFileSync('src/components/ManualDrawModal.tsx', c);
