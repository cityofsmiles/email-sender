const SHEET_ID = '1LaJ0Hq7V-GPoCupAk-sm1i3e2k4cuEbRpo7eLKoJ9SQ';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

let products = [];
const searchInput = document.getElementById('searchInput');
const composerDiv = document.getElementById('emailComposer');
const errorDiv = document.getElementById('error');
const loadingDiv = document.getElementById('loading');
const titleDisplay = document.getElementById('productTitleDisplay');

// Form Fields
const emailToInput = document.getElementById('emailTo');
const subjectInput = document.getElementById('emailSubject');
const bodyInput = document.getElementById('emailBody');
const attachmentInput = document.getElementById('emailAttachment');
const sendBtn = document.getElementById('sendBtn');

// Fetch data
async function fetchProducts() {
    loadingDiv.classList.remove('hidden');
    try {
        const response = await fetch(CSV_URL);
        const data = await response.text();
        parseCSV(data);
        loadingDiv.classList.add('hidden');
    } catch (err) {
        console.error(err);
        loadingDiv.innerText = "Error loading database. Please ensure the sheet is published as CSV.";
    }
}

// Parse CSV - **UPDATED INDICES BASED ON YOUR HEADERS**
function parseCSV(csvText) {
    const rows = csvText.split('\n').map(row => row.split(','));
    
    products = rows.slice(1).map(row => ({
        id: row[0]?.trim(),           // Index 0: ProductID
        title: row[1]?.trim(),        // Index 1: ProductTitle
        grade: row[2]?.trim(),        // Index 2: GradeLevel
        type: row[4]?.trim(),         // Index 4: ProductType
        filePath: row[10]?.trim()     // Index 10: FilePath
    })).filter(p => p.id); 
}

// Search & Populate Form
searchInput.addEventListener('input', (e) => {
    // Convert to uppercase and trim spaces for robust searching
    const query = e.target.value.trim().toUpperCase();
    
    // Hide Composer and Error if search box is empty
    if (!query) {
        composerDiv.classList.add('hidden');
        errorDiv.classList.add('hidden');
        return;
    }

    // Find exact match
    const match = products.find(p => p.id.toUpperCase() === query);

    if (match) {
        // Show Result Section
        composerDiv.classList.remove('hidden');
        errorDiv.classList.add('hidden');
        titleDisplay.textContent = match.title;

        // Auto-fill Fields
        subjectInput.value = match.title;
        attachmentInput.value = match.filePath;
        
        // Template Logic
        const messageTemplate = `Naka-attach dito ang ${match.type} mo, Grade ${match.grade} KasaMath. Salamat sa pagsuporta sa TeXMathPro. Sa uulitin po!

Attachment Link: ${match.filePath}`;
        
        bodyInput.value = messageTemplate;

    } else {
        composerDiv.classList.add('hidden');
        // Only show "not found" if the user has typed a meaningful ID length
        if(query.length > 5) errorDiv.classList.remove('hidden');
    }
});

// "Send" Button Logic (Mailto)
sendBtn.addEventListener('click', () => {
    const email = emailToInput.value;
    const subject = encodeURIComponent(subjectInput.value);
    const body = encodeURIComponent(bodyInput.value);
    
    // Create mailto link
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
});

// Initialize
fetchProducts();
