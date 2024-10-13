const API_URL = 'http://127.0.0.1:8080';

const NASA_API_KEY = 'a8wgWFQCt4GszpzatKzy7ijwqhZoo97hfPr3vnpf';

const NASA_API_URL = 'https://power.larc.nasa.gov/api/temporal/daily/point';

let chart;

// Navigation

document.querySelectorAll('nav a').forEach(link => {

    link.addEventListener('click', (e) => {

        e.preventDefault();

        const pageId = e.target.getAttribute('data-page');

        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));

        document.getElementById(pageId).classList.add('active');

        if (pageId === 'weather') {

            updateWeatherData();

        }

    });

});

// Helper function to format the date as 'YYYYMMDD'

function formatDate(date) {

    const year = date.getFullYear();

    const month = String(date.getMonth() + 1).padStart(2, '0');

    const day = String(date.getDate()).padStart(2, '0');

    return `${year}${month}${day}`;

}

// Home page

async function updateCurrentData() {

    try {

        const response = await fetch(`${API_URL}/current`);

        const data = await response.json();

        document.getElementById('current-temp').textContent = data.temp !== null ? data.temp.toFixed(1) : '--';

        document.getElementById('current-humidity').textContent = data.humidity !== null ? data.humidity.toFixed(1) : '--';

    } catch (error) {

        console.error("Error fetching current data:", error);

    }

}

const toggleButton = document.getElementById('toggle-cooler');

let isOn = false;

toggleButton.addEventListener('click', async () => {

    const command = isOn ? 'off' : 'on';

    await fetch(`${API_URL}/control`, {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ command }),

    });

    isOn = !isOn;

    toggleButton.textContent = isOn ? 'Turn Off Thermo Cooler' : 'Turn On Thermo Cooler';

});

// Temperature & Humidity page

async function updateTempHumidityChart() {

    try {

        const response = await fetch(`${API_URL}/history`);

        const data = await response.json();

        const ctx = document.getElementById('temp-humidity-chart').getContext('2d');

        if (chart) {

            chart.destroy();

        }

        chart = new Chart(ctx, {

            type: 'line',

            data: {

                labels: data.map(entry => new Date(entry.timestamp).toLocaleTimeString()),

                datasets: [

                    {

                        label: 'Temperature (°C)',

                        data: data.map(entry => entry.temp),

                        borderColor: 'rgb(255, 99, 132)',

                        tension: 0.1

                    },

                    {

                        label: 'Humidity (%)',

                        data: data.map(entry => entry.humidity),

                        borderColor: 'rgb(54, 162, 235)',

                        tension: 0.1

                    }

                ]

            },

            options: {

                responsive: true,

                scales: {

                    x: {

                        display: true,

                        title: {

                            display: true,

                            text: 'Time'

                        }

                    },

                    y: {

                        display: true,

                        title: {

                            display: true,

                            text: 'Value'

                        }

                    }

                }

            }

        });

    } catch (error) {

        console.error("Error fetching temperature and humidity history:", error);

    }

}

// Weather Data page

async function updateWeatherData() {

    const weatherDataElement = document.getElementById('weather-data');

    weatherDataElement.innerHTML = 'Loading NASA weather data...';

    try {

        const today = new Date();

        const startDate = new Date(today);

        startDate.setDate(today.getDate() - 7);  // Get data for the last 7 days

        // Format dates as YYYYMMDD

        const startFormatted = formatDate(startDate);

        const endFormatted = formatDate(today);

        console.log(`Start date: ${startFormatted}, End date: ${endFormatted}`); // Debugging info

        const params = new URLSearchParams({

            start: startFormatted,

            end: endFormatted,

            latitude: '51.5074',  // Example: London latitude

            longitude: '-0.1278', // Example: London longitude

            community: 'RE',

            parameters: 'T2M,T2M_MAX,T2M_MIN,PRECTOTCORR,RH2M',

            format: 'JSON',

            api_key: NASA_API_KEY

        });

        const response = await fetch(`${NASA_API_URL}?${params}`);

        const data = await response.json();

        console.log('NASA API Response:', data);  // Log the entire response for debugging

        if (data.messages && data.messages.length > 0) {

            weatherDataElement.innerHTML = `Error: ${data.messages.join(', ')}`;

            return;

        }

        if (!data.properties || !data.properties.parameter) {

            throw new Error('Unexpected API response structure');

        }

        let htmlContent = '<h3>NASA POWER Weather Data (Last 7 Days)</h3>';

        htmlContent += '<table><tr><th>Date</th><th>Avg Temp (°C)</th><th>Max Temp (°C)</th><th>Min Temp (°C)</th><th>Precipitation (mm)</th><th>Humidity (%)</th></tr>';

        const { T2M, T2M_MAX, T2M_MIN, PRECTOTCORR, RH2M } = data.properties.parameter;

        for (const date in T2M) {

            const avgTemp = T2M[date].toFixed(1);

            const maxTemp = T2M_MAX[date].toFixed(1);

            const minTemp = T2M_MIN[date].toFixed(1);

            const precip = PRECTOTCORR[date].toFixed(1);

            const humidity = RH2M[date].toFixed(1);

            htmlContent += `<tr><td>${date}</td><td>${avgTemp}</td><td>${maxTemp}</td><td>${minTemp}</td><td>${precip}</td><td>${humidity}</td></tr>`;

        }

        htmlContent += '</table>';

        weatherDataElement.innerHTML = htmlContent;

    } catch (error) {

        console.error('Error fetching NASA weather data:', error);

        weatherDataElement.innerHTML = `Error fetching NASA weather data: ${error.message}. Check the console for more details.`;

    }

}

// Export Data page

document.getElementById('export-csv').addEventListener('click', async () => {

    try {

        const response = await fetch(`${API_URL}/history`);

        const data = await response.json();

        const csv = data.map(row => `${row.timestamp},${row.temp},${row.humidity}`).join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });

        const url = window.URL.createObjectURL(blob);

        const a = document.createElement('a');

        a.style.display = 'none';

        a.href = url;

        a.download = 'temperature_humidity_data.csv';

        document.body.appendChild(a);

        a.click();

        window.URL.revokeObjectURL(url);

    } catch (error) {

        console.error("Error exporting data:", error);

    }

});

// Update data periodically

setInterval(updateCurrentData, 5000);

setInterval(updateTempHumidityChart, 60000);

// Initial data load

updateCurrentData();

updateTempHumidityChart();

updateWeatherData();