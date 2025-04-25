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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// Determine the environment (local vs production)
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
console.log('Environment:', import.meta.env.MODE);
console.log('BASE_URL:', BASE_URL);

// Set default headers for axios to handle CORS and content type
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.withCredentials = false; // Disable credentials unless needed

const App = () => {
  const [historicalData, setHistoricalData] = useState([]);
  const [forecastData, setForecastData] = useState([]);
  const [weatherData, setWeatherData] = useState({});
  const [metrics, setMetrics] = useState({});
  const [error, setError] = useState(null);
  const [powerType, setPowerType] = useState('DC_POWER');
  const [inverter, setInverter] = useState('all');
  const [botQuery, setBotQuery] = useState('');
  const [botResponse, setBotResponse] = useState('');

  const cities = [
    { name: 'New Delhi', lat: 28.6139, lon: 77.2090 },
    { name: 'Mumbai', lat: 19.0760, lon: 72.8777 },
    { name: 'Bangalore', lat: 12.9716, lon: 77.5946 },
    { name: 'Chennai', lat: 13.0827, lon: 80.2707 },
    { name: 'Kolkata', lat: 22.5726, lon: 88.3639 },
    { name: 'Hyderabad', lat: 17.3850, lon: 78.4867 },
    { name: 'Ahmedabad', lat: 23.0225, lon: 72.5714 },
    { name: 'Jaipur', lat: 26.9124, lon: 75.7873 },
    { name: 'Lucknow', lat: 26.8467, lon: 80.9462 },
    { name: 'Patna', lat: 25.5941, lon: 85.1376 },
    { name: 'Bhopal', lat: 23.2599, lon: 77.4126 },
    { name: 'Thiruvananthapuram', lat: 8.5241, lon: 76.9366 },
    { name: 'Dispur', lat: 26.1445, lon: 91.7362 },
    { name: 'Bhubaneswar', lat: 20.2961, lon: 85.8245 },
    { name: 'Gandhinagar', lat: 23.2156, lon: 72.6369 },
    { name: 'Chandigarh', lat: 30.7333, lon: 76.7794 },
    { name: 'Shimla', lat: 31.1048, lon: 77.1734 },
    { name: 'Srinagar', lat: 34.0837, lon: 74.7973 },
    { name: 'Ranchi', lat: 23.3441, lon: 85.3096 },
    { name: 'Raipur', lat: 21.2514, lon: 81.6296 },
    { name: 'Panaji', lat: 15.4909, lon: 73.8278 },
    { name: 'Imphal', lat: 24.8170, lon: 93.9368 },
    { name: 'Shillong', lat: 25.5788, lon: 91.8933 },
    { name: 'Aizawl', lat: 23.7271, lon: 92.7176 },
    { name: 'Kohima', lat: 25.6747, lon: 94.1100 },
    { name: 'Agartala', lat: 23.8315, lon: 91.2868 },
    { name: 'Itanagar', lat: 27.0844, lon: 93.6053 },
    { name: 'Dehradun', lat: 30.3165, lon: 78.0322 },
    { name: 'Gangtok', lat: 27.3389, lon: 88.6065 },
    { name: 'Puducherry', lat: 11.9416, lon: 79.8083 },
    { name: 'Port Blair', lat: 11.6234, lon: 92.7265 },
    { name: 'Leh', lat: 34.1526, lon: 77.5771 },
    { name: 'Daman', lat: 20.4283, lon: 72.8397 },
    { name: 'Silvassa', lat: 20.2763, lon: 73.0083 },
    { name: 'Kavaratti', lat: 10.5593, lon: 72.6358 },
    { name: 'Amaravati', lat: 16.5410, lon: 80.5150 },
  ];

  useEffect(() => {
    console.log('App component mounted, fetching data...');
    fetchData();
  }, [powerType, inverter]);

  const fetchData = async () => {
    try {
      console.log('Fetching historical data from:', `${BASE_URL}/api/historical?power_type=${powerType}&inverter=${inverter}`);
      const historicalResponse = await axios.get(
        `${BASE_URL}/api/historical?power_type=${powerType}&inverter=${inverter}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          timeout: 10000, // Add a timeout of 10 seconds to handle slow networks
        }
      );
      console.log('Historical Data:', historicalResponse.data);
      setHistoricalData(historicalResponse.data);

      console.log('Fetching forecast data from:', `${BASE_URL}/api/forecast?power_type=${powerType}&inverter=${inverter}`);
      const forecastResponse = await axios.get(
        `${BASE_URL}/api/forecast?power_type=${powerType}&inverter=${inverter}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          timeout: 10000,
        }
      );
      console.log('Forecast Data:', forecastResponse.data);
      setForecastData(forecastResponse.data.forecast || []);
      setMetrics(forecastResponse.data.metrics || {});
    } catch (err) {
      console.error('Fetch error:', err);
      const errorMessage = err.response
        ? `Failed to fetch data: ${err.response.status} ${err.response.statusText}`
        : `Failed to fetch data: ${err.message}. Backend might be unreachable at ${BASE_URL}.`;
      setError(errorMessage);
    }
  };

  const fetchWeatherData = async (lat, lon, cityName) => {
    try {
      const apiKey = import.meta.env.VITE_WEATHER_API_KEY || 'bd47081533c66550286112892cea28c4';
      if (!apiKey) {
        throw new Error('Weather API key is missing. Set VITE_WEATHER_API_KEY in your environment variables.');
      }
      console.log(`Fetching weather data for ${cityName} with API key: ${apiKey}`);
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          timeout: 10000,
        }
      );
      console.log(`Weather Data for ${cityName}:`, response.data);
      setWeatherData(prev => ({ ...prev, [cityName]: response.data }));
    } catch (err) {
      console.error(`Error fetching weather data for ${cityName}:`, err.message);
      setWeatherData(prev => ({ ...prev, [cityName]: null }));
    }
  };

  const handleSolarBotQuery = async () => {
    try {
      if (!botQuery.trim()) {
        setBotResponse('Please enter a query for SolarBot.');
        return;
      }
      console.log('Sending SolarBot query:', botQuery);
      const response = await axios.post(
        `${BASE_URL}/api/solarbot`,
        { query: botQuery },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          timeout: 10000,
        }
      );
      console.log('SolarBot Response:', response.data);
      setBotResponse(response.data.response || 'No response received from SolarBot.');
    } catch (err) {
      console.error('Error querying SolarBot:', err);
      const errorMessage = err.response
        ? `Error querying SolarBot: ${err.response.status} ${err.response.statusText}`
        : `Error querying SolarBot: ${err.message}. Backend might be unreachable at ${BASE_URL}.`;
      setBotResponse(errorMessage);
    }
  };

  const downloadData = () => {
    try {
      const combinedData = [
        ...historicalData.map(d => ({ ...d, type: 'historical' })),
        ...forecastData.map(d => ({ ...d, type: 'forecast' }))
      ];
      const csvContent = [
        ['Type', 'Date Time', 'Actual', 'Predicted', 'Plant ID'],
        ...combinedData.map(row => [
          row.type,
          row.date_time,
          row.actual || '',
          row.predicted || '',
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
    } catch (err) {
      console.error('Error downloading data:', err);
      alert('Failed to download data. Please try again.');
    }
  };

  if (error) {
    return (
      <div className="text-center text-red-500 p-6">
        <p>Error: {error}</p>
        <button onClick={() => { setError(null); fetchData(); }} className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
          Retry
        </button>
      </div>
    );
  }

  const timeLabels = forecastData.length > 0
    ? forecastData.map(d => new Date(d.date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    : Array(96).fill('').map((_, i) => {
        const hour = Math.floor(i / 4);
        const minute = (i % 4) * 15;
        return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      });

  const forecastChartData = {
    labels: timeLabels,
    datasets: [
      {
        label: 'Actual DC Power',
        data: forecastData.map(d => d.actual || 0),
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        fill: false,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: 'rgba(54, 162, 235, 1)',
      },
      {
        label: 'Predicted DC Power',
        data: forecastData.map(d => d.predicted || 0),
        borderColor: 'rgba(255, 159, 64, 1)',
        backgroundColor: 'rgba(255, 159, 64, 0.2)',
        fill: false,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: 'rgba(255, 159, 64, 1)',
      },
    ],
  };

  const errorTrendData = {
    labels: timeLabels,
    datasets: [
      {
        label: 'Prediction Error',
        data: forecastData.map(d => d.error || 0),
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        fill: false,
        tension: 0.4,
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
                title: { display: false },
              },
              scales: {
                x: {
                  title: { display: false },
                  ticks: { maxRotation: 45, minRotation: 45 },
                },
                y: {
                  title: { display: true, text: 'Power (kW)' },
                  beginAtZero: false,
                  min: 0,
                  max: 1000,
                },
              },
              elements: { line: { tension: 0.4 } },
            }}
          />
        </div>
      </div>

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
