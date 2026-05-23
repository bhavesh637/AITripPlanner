function HotelCard({ hotel }) {

  const openMap = () => {

    if (
      hotel?.latitude &&
      hotel?.longitude
    ) {

      window.open(
        `https://www.google.com/maps?q=${hotel.latitude},${hotel.longitude}`,
        "_blank"
      );

    }

  };

  return (

    <div className="bg-white dark:bg-slate-900 rounded-[25px] sm:rounded-[35px] overflow-hidden shadow-xl hover:shadow-2xl hover:scale-[1.02] transition duration-300 border border-gray-200">

      {/* Hotel Image */}

      <div className="relative">

        <img
          src={hotel.image}
          alt={hotel.name}
          className="w-full h-64 object-cover"
        />

        <div className="absolute top-4 right-4 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-bold">

          {hotel.rating}

        </div>

      </div>

      {/* Hotel Content */}

      <div className="p-6">

        <h2 className="text-2xl font-bold mb-3">
          {hotel.name}
        </h2>

        <div className="bg-gray-100 rounded-2xl p-4 mb-4">

          <p className="text-gray-600">
            📍 {hotel.area}
          </p>

        </div>

        <div className="flex items-center justify-between mb-6">

          <div>

            <p className="text-gray-500 text-sm">
              Price Per Night
            </p>

            <h3 className="text-3xl font-bold text-blue-600">
              {hotel.price}
            </h3>

          </div>

          <div className="bg-green-100 px-4 py-2 rounded-full font-bold text-green-700">

            Premium Stay

          </div>

        </div>

        <div className="flex gap-3">

          <button
            onClick={openMap}
            className="flex-1 bg-black text-white py-3 rounded-2xl font-semibold hover:scale-105 transition"
          >
            View Map
          </button>

          <button
            className="flex-1 bg-blue-600 text-white py-3 rounded-2xl font-semibold hover:scale-105 transition"
          >
            Book Hotel
          </button>

        </div>

      </div>

    </div>

  );

}

export default HotelCard;