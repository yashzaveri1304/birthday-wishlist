// A single, slow pink glow behind the hero. Pure CSS (transform only).
export function Background() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[46rem] overflow-hidden"
      aria-hidden
    >
      <div
        className="glow"
        style={{
          width: "70rem",
          height: "70rem",
          top: "-38rem",
          left: "calc(50% - 35rem)",
        }}
      />
    </div>
  );
}
