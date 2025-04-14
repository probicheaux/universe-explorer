import UniverseExplorer from "../components/UniverseExplorer";

export default function Home() {
  return (
    <div className="w-screen h-screen p-8 bg-black relative">
      <div className="relative h-full w-full rounded-xl bg-gray-900/50 backdrop-blur-md border border-gray-800 shadow-lg overflow-hidden">
        <UniverseExplorer />
      </div>
    </div>
  );
}
