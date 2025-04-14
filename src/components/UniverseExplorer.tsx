"use client";

import { useState } from "react";
import ImageArea from "./ImageArea";
import PromptArea from "./PromptArea";

interface ExplorerData {
  image?: string;
  prompt?: string;
}

export default function UniverseExplorer() {
  const [data, setData] = useState<ExplorerData>({});

  return (
    <div className="w-full max-w-4xl mx-auto p-6 font-mono">
      <h1 className="text-4xl font-semibold mb-4">Universe Explorer</h1>
      <div className="w-full h-[600px] bg-gray-900/50 rounded-lg overflow-hidden flex flex-col">
        <ImageArea
          image={data.image}
          onImageChange={(image) => setData((prev) => ({ ...prev, image }))}
        />
        <PromptArea
          prompt={data.prompt}
          onPromptChange={(prompt) => setData((prev) => ({ ...prev, prompt }))}
        />
      </div>
    </div>
  );
}
