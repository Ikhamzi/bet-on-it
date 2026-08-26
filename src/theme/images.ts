// Verified free-to-use Unsplash photos (Unsplash License — no attribution
// required). Each helper appends sizing params so we only ship the
// resolution we actually render at.
function unsplash(id: string, width: number) {
  return `https://images.unsplash.com/${id}?fm=jpg&q=70&w=${width}&auto=format&fit=crop`;
}

export const images = {
  diceHero: (width = 1000) => unsplash("photo-1632931124386-2576db31ab97", width),
  ludoBoard: (width = 700) => unsplash("photo-1596687909057-dfac2b25b891", width),
  snakesAndLadders: (width = 700) => unsplash("photo-1642056447310-b2163a0218b8", width),
};
