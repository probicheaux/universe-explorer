interface Point {
  x: number;
  y: number;
}

interface BoundingBoxProps {
  start: Point;
  end: Point;
  label: string;
  isActive?: boolean;
  color?: string;
}

// Generate a color based on the label
const getColorForLabel = (label: string): string => {
  // Use a simple hash function to generate a consistent color for each label
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    hash = label.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Convert to hex color
  let color = "#";
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += ("00" + value.toString(16)).substr(-2);
  }

  return color;
};

export default function BoundingBox({
  start,
  end,
  label,
  isActive = false,
  color: providedColor,
}: BoundingBoxProps) {
  const left = Math.min(start.x, end.x);
  const top = Math.min(start.y, end.y);
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);

  // Use provided color or generate one based on label
  const color = providedColor || getColorForLabel(label);

  // Create a slightly transparent version of the color for the background
  const bgColor = color + "20"; // 20 is hex for 12% opacity

  return (
    <div
      className={`absolute border-2 ${
        isActive ? "border-opacity-100" : "border-opacity-80"
      }`}
      style={{
        left,
        top,
        width,
        height,
        borderColor: color,
        backgroundColor: bgColor,
      }}
    >
      <div
        className="absolute -top-6 left-0 text-white text-xs px-2 py-1 rounded"
        style={{ backgroundColor: color }}
      >
        {label}
      </div>
    </div>
  );
}
