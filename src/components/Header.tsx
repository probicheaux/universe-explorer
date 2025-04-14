export default function Header() {
  return (
    <div className="text-center mb-8">
      <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
        Universe Explorer
      </h1>
      <p className="text-purple-300/70 max-w-md mx-auto">
        Explore the power of computer vision with Roboflow Universe. Upload an
        image and provide a prompt to get started.
      </p>
    </div>
  );
}
