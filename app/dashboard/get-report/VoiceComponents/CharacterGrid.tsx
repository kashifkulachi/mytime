const letters = [
  "7",
  "K",
  "3",
  "M",
  "B",
  "L",
  "E",
  "2",
  "G",
  "1",
  "4",
  "R",
  "I",
  "P",
  "0",
  "D",
  "8",
  "T",
  "O",
  "5",
  "S",
  "6",
  "F",
  "9",
  "A",
  "N",
  "U",
  "H",
  "C",
  "J",
];

export function CharacterGrid() {
  return (
    <div className="w-55  rounded-xl border bg-white border-outline-variant shadow-sm p-md mb-lg">
      <div className="grid grid-cols-5  gap-[7px] h-full p-3">
        {letters.map((item, index) => (
          <div
            key={item}
            className={`flex items-center justify-center text-on-primary rounded font-display text-headline-sm ${
              index === 0
                ? "bg-primary text-xl text-on-primary"
                : "bg-surface-container text-on-surface-variant"
            }`}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
