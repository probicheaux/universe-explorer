interface Point {
  x: number;
  y: number;
}

interface DrawingGuidesProps {
  mousePosition: Point;
}

export default function DrawingGuides({ mousePosition }: DrawingGuidesProps) {
  return (
    <>
      {/* Vertical Guide */}
      <div
        className="absolute w-px h-full bg-blue-500/50"
        style={{ left: mousePosition.x }}
      />
      {/* Horizontal Guide */}
      <div
        className="absolute h-px w-full bg-blue-500/50"
        style={{ top: mousePosition.y }}
      />
    </>
  );
}
