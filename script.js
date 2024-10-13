const API_KEY = "iZH6YRJ7aBd54me8m2AsXtDCX0HVpJARQoWbUCsc";

// Function to fetch temperature and humidity data

function fetchSensorData() {

    fetch('/data')

        .then(response => response.json())

        .then(data => {

            if (data.length > 0) {

                const latest = data[data.length - 1];

                document.getElementById('current-temp').innerText = latest.temperature;

                document.getElementById('current-humidity').innerText = latest.humidity;

            }

        })

        .catch(err => {

            console.error("Error fetching sensor data:", err);

        });

}

// Function to fetch weather data from NASA API

function fetchWeatherData() {

    const url = `https://api.nasa.gov/insight_weather/?api_key=${API_KEY}&feedtype=json&ver=1.0`;

    

    fetch(url)

        .then(response => response.json())

        .then(data => {

            // Assuming data contains the relevant weather data

            const weatherInfo = JSON.stringify(data, null, 2);

            document.getElementById('weather-data').innerText = weatherInfo;

        })

        .catch(err => {

            console.error("Error fetching weather data:", err);

        });

}

// Function to initialize temperature and humidity chart

function initTempHumidityChart() {

    const ctx = document.getElementById('temp-humidity-chart').getContext('2d');

    fetch('/data')

        .then(response => response.json())

        .then(data => {

            const temperatures = data.map(entry => entry.temperature);

            const humidities = data.map(entry => entry.humidity);

            const labels = data.map(entry => new Date(entry.timestamp).toLocaleString());

            const chart = new Chart(ctx, {

                type: 'line',

                data: {

                    labels: labels,

                    datasets: [

                        {

                            label: 'Temperature (°C)',

                            data: temperatures,

                            borderColor: 'rgba(75, 192, 192, 1)',

                            borderWidth: 1,

                            fill: false

                        },

                        {

                            label: 'Humidity (%)',

                            data: humidities,

                            borderColor: 'rgba(153, 102, 255, 1)',

                            borderWidth: 1,

                            fill: false

                        }

                    ]

                },

                options: {

                    responsive: true,

                    scales: {

                        x: {

                            type: 'time',

                            time: {

                                unit: 'minute'

                            }

                        },

                        y: {

                            beginAtZero: true

                        }

                    }

                }

            });

        });

}

// Toggle Peltier cooler

document.getElementById('toggle-cooler').addEventListener('click', () => {

    fetch('/toggle-peltier', {

        method: 'POST',

    })

        .then(response => {

            if (response.ok) {

                alert('Thermo cooler toggled');

            }

        })

        .catch(err => {

            console.error("Error toggling cooler:", err);

        });

});

// Export data as CSV

document.getElementById('export-csv').addEventListener('click', () => {

    fetch('/export-data')

        .then(response => response.blob())

        .then(blob => {

            const url = window.URL.createObjectURL(blob);

            const a = document.createElement('a');

            a.href = url;

            a.download = 'sensor_data.csv';

            a.click();

        });

});

// Navigation functionality

document.querySelectorAll('nav a').forEach(link => {

    link.addEventListener('click', (event) => {

        event.preventDefault();

        const page = event.target.getAttribute('data-page');

        document.querySelectorAll('.page').forEach(p => {

            p.classList.remove('active'); // Hide all pages

        });

        

        document.getElementById(page).classList.add('active'); // Show the selected page

        // Initialize temperature and humidity chart if on that page

        if (page === 'temp-humidity') {

            initTempHumidityChart();

        }

        // Fetch weather data if on the weather page

        if (page === 'weather') {

            fetchWeatherData();

        }

    });

});

// Initial data fetch on page load

fetchSensorData();