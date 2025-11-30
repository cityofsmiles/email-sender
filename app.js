const SHEET_ID = '1LaJ0Hq7V-GPoCupAk-sm1i3e2k4cuEbRpo7eLKoJ9SQ';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

let products = [];
const searchInput = document.getElementById('searchInput');
const resultDiv = document.getElementById('result');
const titleDisplay = document.getElementById('productTitle');
const idDisplay = document.getElementById('productIdLabel');
const errorDiv = document.getElementById('error');
const loadingDiv = document.getElementById('loading');

// Fetch data when app starts
async function fetchProducts() {
    loadingDiv.classList.remove('hidden');
    try {
        const response = await fetch(CSV_URL);
        const data = await response.text();
        parseCSV(data);
        loadingDiv.classList.add('hidden');
    } catch (err) {
        console.error('Error fetching data:', err);
        loadingDiv.innerText = "Error loading database. Check connection.";
    }
}

// Simple CSV Parser
function parseCSV(csvText) {
    const rows = csvText.split('\n').map(row => row.split(','));
    // Assuming Row 1 is headers: ProductID is col 0, ProductTitle is col 1
    // We skip the header row (slice 1)
    products = rows.slice(1).map(row => ({
        id: row[0]?.trim(),       // Column A: ProductID
        title: row[1]?.trim()     // Column B: ProductTitle
    })).filter(p => p.id); // Remove empty rows
}

// Search Logic
searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim().toLowerCase();
    
    if (!query) {
        resultDiv.classList.add('hidden');
        errorDiv.classList.add('hidden');
        return;
    }

    // Exact match search on ProductID
    const match = products.find(p => p.id.toLowerCase() === query);

    if (match) {
        titleDisplay.textContent = match.title;
        idDisplay.textContent = `ID: ${match.id}`;
        resultDiv.classList.remove('hidden');
        errorDiv.classList.add('hidden');
    } else {
        resultDiv.classList.add('hidden');
        // Only show "not found" if they have typed a significant length
        if(query.length > 3) errorDiv.classList.remove('hidden');
    }
});

// Initialize
fetchProducts();
