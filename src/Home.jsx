import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">

      <h1 className="text-5xl font-bold mb-5">
        AI Travel Planner
      </h1>

      <p className="text-xl mb-6">
        Generate smart AI travel itineraries
      </p>

      <Link
        to="/planner"
        className="bg-black text-white px-6 py-3 rounded-xl"
      >
        Start Planning
      </Link>

    </div>
  );
}

export default Home;