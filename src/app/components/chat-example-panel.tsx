export default function ExamplePanel({
  setInput,
}: {
  setInput: (input: string) => void;
}) {
  return (
    <div className="px-4 py-2 border-t border-b border-gray-100">
      <p className="text-sm text-gray-500 mb-2">
        Start a conversation to generate or modify diagrams.
      </p>
      <p className="text-sm text-gray-500 mb-2">Try these examples:</p>
      <div className="flex flex-wrap gap-5">
        <button
          className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-1 px-2 rounded"
          onClick={() => setInput("Draw a cat for me")}
        >
          Draw a cat for me
        </button>
        <button
          className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-1 px-2 rounded"
          onClick={() =>
            setInput("Create a flowchart with start, process, and end")
          }
        >
          Create a flowchart
        </button>
        <button
          className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-1 px-2 rounded"
          onClick={() => setInput("Draw an organizational chart")}
        >
          Org chart
        </button>
      </div>
    </div>
  );
}
