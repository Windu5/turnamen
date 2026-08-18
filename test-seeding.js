function generateSeeding(size) {
  let order = [0, 1];
  let currentSize = 2;
  
  while (currentSize < size) {
    let nextOrder = [];
    for (let i = 0; i < order.length; i++) {
      let val = order[i];
      // We want the pair to sum to currentSize * 2 - 1
      // e.g. for size 4, if val is 0, pair is 0, 3
      nextOrder.push(val);
      nextOrder.push(currentSize * 2 - 1 - val);
    }
    order = nextOrder;
    currentSize *= 2;
  }
  return order;
}
console.log(generateSeeding(16));
