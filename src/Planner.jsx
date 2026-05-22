function Planner() {
  return (
    <div className="p-10">

      <h1 className="text-4xl font-bold mb-5">
        Planner Page
      </h1>

      <input
        type="text"
        placeholder="Destination"
        className="border p-3 w-full mb-4"
      />

      <button className="bg-black text-white px-5 py-3 rounded">
        Generate Trip
      </button>

    </div>
  );
}

export default Planner;