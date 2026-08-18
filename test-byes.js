function generateSymmetricalByes(bracketSize, numByes) {
  let order = [0, 1];
  let currentSize = 2;
  
  while (currentSize < bracketSize) {
    let nextOrder = [];
    for (let i = 0; i < order.length; i++) {
      let val = order[i];
      nextOrder.push(val);
      nextOrder.push(currentSize * 2 - 1 - val);
    }
    order = nextOrder;
    currentSize *= 2;
  }
  
  const seedPositions = order.length === bracketSize ? order : [];
  for (let i = 0; i < bracketSize; i++) {
    if (!seedPositions.includes(i)) seedPositions.push(i);
  }
  
  const slots = new Array(bracketSize).fill(null);
  for (let i = 0; i < numByes; i++) {
    slots[seedPositions[i]] = "BYE";
  }
  
  return slots;
}

const slots = generateSymmetricalByes(16, 6);
for (let m = 0; m < 8; m++) {
    console.log(`Match ${m}: ${slots[m*2]} vs ${slots[m*2+1]}`);
}
