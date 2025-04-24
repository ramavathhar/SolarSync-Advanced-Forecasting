import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'leaflet/dist/leaflet.css';
import './index.css';
import L from 'leaflet';

// Fix default icon paths (ensuring red markers)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const App = () => {
  const [historicalData, setHistoricalData] = useState([]);
  const [forecastData, setForecastData] = useState([]);
  const [weatherData, setWeatherData] = useState({});
  const [metrics, setMetrics] = useState({});
  const [error, setError] = useState(null);
  const [powerType, setPowerType] = useState('DC_POWER'); // Default to DC_POWER to match the image
  const [inverter, setInverter] = useState('all');
  const [botQuery, setBotQuery] = useState('');
  const [botResponse, setBotResponse] = useState('');

  // Major cities representing all Indian states/UTs (36 entries)
  const cities = [
    { name: 'New Delhi', lat: 28.6139, lon: 77.2090 }, // Delhi
    { name: 'Mumbai', lat: 19.0760, lon: 72.8777 }, // Maharashtra
    { name: 'Bangalore', lat: 12.9716, lon: 77.5946 }, // Karnataka
    { name: 'Chennai', lat: 13.0827, lon: 80.2707 }, // Tamil Nadu
    { name: 'Kolkata', lat: 22.5726, lon: 88.3639 }, // West Bengal
    { name: 'Hyderabad', lat: 17.3850, lon: 78.4867 }, // Telangana
    { name: 'Ahmedabad', lat: 23.0225, lon: 72.5714 }, // Gujarat
    { name: 'Jaipur', lat: 26.9124, lon: 75.7873 }, // Rajasthan
    { name: 'Lucknow', lat: 26.8467, lon: 80.9462 }, // Uttar Pradesh
    { name: 'Patna', lat: 25.5941, lon: 85.1376 }, // Bihar
    { name: 'Bhopal', lat: 23.2599, lon: 77.4126 }, // Madhya Pradesh
    { name: 'Thiruvananthapuram', lat: 8.5241, lon: 76.9366 }, // Kerala
    { name: 'Dispur', lat: 26.1445, lon: 91.7362 }, // Assam
    { name: 'Bhubaneswar', lat: 20.2961, lon: 85.8245 }, // Odisha
    { name: 'Gandhinagar', lat: 23.2156, lon: 72.6369 }, // Gujarat
    { name: 'Chandigarh', lat: 30.7333, lon: 76.7794 }, // Chandigarh
    { name: 'Shimla', lat: 31.1048, lon: 77.1734 }, // Himachal Pradesh
    { name: 'Srinagar', lat: 34.0837, lon: 74.7973 }, // Jammu & Kashmir
    { name: 'Ranchi', lat: 23.3441, lon: 85.3096 }, // Jharkhand
    { name: 'Raipur', lat: 21.2514, lon: 81.6296 }, // Chhattisgarh
    { name: 'Panaji', lat: 15.4909, lon: 73.8278 }, // Goa
    { name: 'Imphal', lat: 24.8170, lon: 93.9368 }, // Manipur
    { name: 'Shillong', lat: 25.5788, lon: 91.8933 }, // Meghalaya
    { name: 'Aizawl', lat: 23.7271, lon: 92.7176 }, // Mizoram
    { name: 'Kohima', lat: 25.6747, lon: 94.1100 }, // Nagaland
    { name: 'Agartala', lat: 23.8315, lon: 91.2868 }, // Tripura
    { name: 'Itanagar', lat: 27.0844, lon: 93.6053 }, // Arunachal Pradesh
    { name: 'Dehradun', lat: 30.3165, lon: 78.0322 }, // Uttarakhand
    { name: 'Gangtok', lat: 27.3389, lon: 88.6065 }, // Sikkim
    { name: 'Puducherry', lat: 11.9416, lon: 79.8083 }, // Puducherry
    { name: 'Port Blair', lat: 11.6234, lon: 92.7265 }, // Andaman & Nicobar
    { name: 'Leh', lat: 34.1526, lon: 77.5771 }, // Ladakh
    { name: 'Daman', lat: 20.4283, lon: 72.8397 }, // Daman & Diu
    { name: 'Silvassa', lat: 20.2763, lon: 73.0083 }, // Dadra & Nagar Haveli
    { name: 'Kavaratti', lat: 10.5593, lon: 72.6358 }, // Lakshadweep
    { name: 'Amaravati', lat: 16.5410, lon: 80.5150 }, // Andhra Pradesh
  ];

  useEffect(() => {
    console.log('App component mounted and useEffect triggered');
    fetchData();
  }, [powerType, inverter]);

  const fetchData = async () => {
    try {
      console.log('Fetching historical data...');
      const historicalResponse = await axios.get(
        `http://localhost:5000/api/historical?power_type=${powerType}&inverter=${inverter}`
      );
      console.log('Historical Data:', historicalResponse.data);
      setHistoricalData(historicalResponse.data);

      console.log('Fetching forecast data...');
      const forecastResponse = await axios.get(
        `http://localhost:5000/api/forecast?power_type=${powerType}&inverter=${inverter}`
      );
      console.log('Forecast Data:', forecastResponse.data);
      setForecastData(forecastResponse.data.forecast || []);
      setMetrics(forecastResponse.data.metrics || {});
    } catch (err) {
      console.error('Fetch error:', err);
      setError(`Failed to fetch data: ${err.message}`);
    }
  };

  const fetchWeatherData = async (lat, lon, cityName) => {
    try {
      const apiKey = 'bd47081533c66550286112892cea28c4';
      console.log(`Fetching weather data for ${cityName}...`);
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
      );
      console.log(`Weather Data for ${cityName}:`, response.data);
      setWeatherData(prev => ({ ...prev, [cityName]: response.data }));
    } catch (err) {
      console.error(`Error fetching weather data for ${cityName}:`, err);
      setWeatherData(prev => ({ ...prev, [cityName]: null }));
    }
  };

  const handleSolarBotQuery = async () => {
    try {
      console.log('Sending SolarBot query:', botQuery);
      const response = await axios.post('http://localhost:5000/api/solarbot', { query: botQuery });
      console.log('SolarBot Response:', response.data);
      setBotResponse(response.data.response);
    } catch (err) {
      console.error('Error querying SolarBot:', err);
      setBotResponse('Sorry, I encountered an error. Please try again.');
    }
  };

  const downloadData = () => {
    const combinedData = [
      ...historicalData.map(d => ({ ...d, type: 'historical' })),
      ...forecastData.map(d => ({ ...d, type: 'forecast' }))
    ];
    const csvContent = [
      ['Type', 'Date Time', 'Actual', 'Predicted', 'Historical', 'Plant ID'],
      ...combinedData.map(row => [
        row.type,
        row.date_time,
        row.actual || '',
        row.predicted || '',
        row.historical || '',
        row.plant_id || ''
      ])
    ]
      .map(e => e.join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'solar_data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (error) {
    return (
      <div className="text-center text-red-500 p-6">
        Error: {error}
        <button onClick={() => window.location.reload()} className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
          Retry
        </button>
      </div>
    );
  }

  // Define the x-axis labels for a 24-hour period from 6 PM to 4 PM the next day
  const timeLabels = [
    '6PM', '7PM', '8PM', '9PM', '10PM', '11PM', '12AM',
    '1AM', '2AM', '3AM', '4AM', '5AM', '6AM', '7AM', '8AM',
    '9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM'
  ];

  // Power Generation Forecast based on Actual, Predicted, and Historical DC Power
  const forecastChartData = {
    labels: timeLabels, // 24 hourly labels
    datasets: [
      {
        label: 'Actual DC Power',
        data: forecastData.map(d => d.actual || 0),
        borderColor: 'rgba(54, 162, 235, 1)', // Blue
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        fill: false,
        tension: 0.4, // Smooth lines
        pointRadius: 4, // Small points to match the image
        pointBackgroundColor: 'rgba(54, 162, 235, 1)',
      },
      {
        label: 'Predicted DC Power',
        data: forecastData.map(d => d.predicted || 0),
        borderColor: 'rgba(255, 159, 64, 1)', // Orange
        backgroundColor: 'rgba(255, 159, 64, 0.2)',
        fill: false,
        tension: 0.4, // Smooth lines
        pointRadius: 4, // Small points
        pointBackgroundColor: 'rgba(255, 159, 64, 1)',
      },
      {
        label: 'Historical Data',
        data: forecastData.map(d => d.historical || 0),
        borderColor: 'rgba(75, 192, 192, 1)', // Green
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderDash: [5, 5], // Dashed line
        fill: false,
        tension: 0.4, // Smooth lines
        pointRadius: 4, // Small points
        pointBackgroundColor: 'rgba(75, 192, 192, 1)',
      },
    ],
  };

  // Error Trend based on Actual vs. Predicted differences
  const errorTrendData = {
    labels: timeLabels, // 24 hourly labels
    datasets: [
      {
        label: 'Prediction Error',
        data: forecastData.map(d => d.error || 0),
        borderColor: 'rgba(255, 99, 132, 1)', // Red
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        fill: false,
        tension: 0.4, // Smooth lines
        pointRadius: 4,
        pointBackgroundColor: 'rgba(255, 99, 132, 1)',
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 p-6">
      <h1 className="text-4xl font-extrabold mb-8 text-center text-indigo-800 tracking-wide animate-pulse">
        SolarSync: Advanced Solar Power Forecasting
      </h1>

      {/* Controls */}
      <div className="flex justify-center mb-6 space-x-4">
        <select
          value={powerType}
          onChange={(e) => setPowerType(e.target.value)}
          className="border rounded-lg p-2 bg-white shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="AC_POWER">AC Power</option>
          <option value="DC_POWER">DC Power</option>
        </select>
        <select
          value={inverter}
          onChange={(e) => setInverter(e.target.value)}
          className="border rounded-lg p-2 bg-white shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Inverters</option>
          {[...new Set(historicalData.map(d => d.plant_id))].map(id => (
            <option key={id} value={id}>{id}</option>
          ))}
        </select>
        <button
          onClick={downloadData}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 shadow-md"
        >
          Download Data
        </button>
      </div>

      {/* Power Generation Forecast */}
      <div className="bg-white shadow-2xl rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Power Generation Forecast</h2>
        <div className="h-96">
          <Line
            data={forecastChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'top' },
                title: { display: false }, // Title is already in the h2 tag
              },
              scales: {
                x: {
                  title: { display: false }, // No x-axis title
                  ticks: { maxRotation: 45, minRotation: 45 }, // Rotate labels for readability
                },
                y: {
                  title: { display: true, text: 'Power (kW)' },
                  beginAtZero: false,
                  min: 350,
                  max: 700,
                },
              },
              elements: { line: { tension: 0.4 } },
            }}
          />
        </div>
      </div>

      {/* Model Performance Metrics */}
      <div className="bg-white shadow-2xl rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Model Performance Metrics</h2>
        {metrics && Object.keys(metrics).length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            <p className="text-gray-700">MAE: <span className="font-bold text-indigo-600">{metrics.mae?.toFixed(2)}</span></p>
            <p className="text-gray-700">RMSE: <span className="font-bold text-indigo-600">{metrics.rmse?.toFixed(2)}</span></p>
            <p className="text-gray-700">MAPE: <span className="font-bold text-indigo-600">{metrics.mape?.toFixed(4)}</span></p>
            <p className="text-gray-700">R²: <span className="font-bold text-indigo-600">{metrics.r2?.toFixed(2)}</span></p>
          </div>
        ) : (
          <p className="text-gray-600">No performance metrics available</p>
        )}
      </div>

      {/* Error Trend */}
      <div className="bg-white shadow-2xl rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Error Trend</h2>
        <div className="h-96">
          <Line
            data={errorTrendData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'top' },
                title: { display: false },
              },
              scales: {
                x: {
                  title: { display: false },
                  ticks: { maxRotation: 45, minRotation: 45 },
                },
                y: { title: { display: true, text: 'Error (kW)' }, beginAtZero: true, max: 100 },
              },
              elements: { line: { tension: 0.4 } },
            }}
          />
        </div>
      </div>

      {/* Weather Map (Markers Only, Popup on Click) */}
      <div className="bg-white shadow-2xl rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Weather Map (Indian States)</h2>
        <div className="h-96">
          <MapContainer center={[20.5937, 78.9629]} zoom={4} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
              attribution='© <a href="https://carto.com/attributions">CARTO</a>'
            />
            {cities.map(city => (
              <Marker
                key={city.name}
                position={[city.lat, city.lon]}
                eventHandlers={{
                  click: () => fetchWeatherData(city.lat, city.lon, city.name),
                }}
              />
            ))}
            {Object.entries(weatherData).map(([cityName, data]) =>
              data && (
                <Popup key={cityName} position={[cities.find(c => c.name === cityName).lat, cities.find(c => c.name === cityName).lon]}>
                  <div>
                    <h3 className="font-bold">{cityName} Weather</h3>
                    <p>Temperature: {data.main.temp}°C</p>
                    <p>Humidity: {data.main.humidity}%</p>
                    <p>Weather: {data.weather[0].description}</p>
                  </div>
                </Popup>
              )
            )}
          </MapContainer>
        </div>
      </div>

      {/* SolarBot */}
      <div className="bg-white shadow-2xl rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">SolarBot</h2>
        <div className="flex space-x-4 mb-4">
          <input
            type="text"
            value={botQuery}
            onChange={(e) => setBotQuery(e.target.value)}
            placeholder="Ask SolarBot about the forecast (e.g., 'Why is the power less today?')"
            className="flex-1 border rounded-lg p-2 shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={handleSolarBotQuery}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 shadow-md"
          >
            Ask
          </button>
        </div>
        {botResponse && (
          <div className="bg-gray-100 p-4 rounded-lg shadow-inner">
            <p className="text-gray-800">{botResponse}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;