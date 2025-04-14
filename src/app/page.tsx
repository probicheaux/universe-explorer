import UniverseExplorer from "../components/UniverseExplorer";

export default function Home() {
  return (
    <div className="flex flex-col gap-4 w-screen h-screen p-8 bg-black relative">
      <h1 className="text-white text-2xl font-bold">Universe Explorer</h1>
      <div className="relative flex-1 w-full rounded-xl bg-gray-900/50 backdrop-blur-md border border-gray-800 shadow-lg overflow-hidden">
        <UniverseExplorer />
      </div>
    </div>
  );
}
