interface Point {
  x: number;
  y: number;
}

interface BoundingBoxProps {
  start: Point;
  end: Point;
  label: string;
  isActive?: boolean;
}

export default function BoundingBox({
  start,
  end,
  label,
  isActive = false,
}: BoundingBoxProps) {
  const left = Math.min(start.x, end.x);
  const top = Math.min(start.y, end.y);
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);

  return (
    <div
      className={`absolute border-2 ${
        isActive ? "border-blue-400" : "border-blue-500"
      } bg-blue-500/10`}
      style={{
        left,
        top,
        width,
        height,
      }}
    >
      <div className="absolute -top-6 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded">
        {label}
      </div>
    </div>
  );
}
