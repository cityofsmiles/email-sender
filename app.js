const SHEET_ID = '1LaJ0Hq7V-GPoCupAk-sm1i3e2k4cuEbRpo7eLKoJ9SQ';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

// Google API Configuration
const CLIENT_ID = '219089573342-uk3i7n5pbc5b4vd0o620jr8jb1dl5rfh.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/gmail.send';

let products = [];
let tokenClient;
let isLoggedIn = false;
let currentProductTitle = ''; // Stores the Product Title to ensure subject is stable

const searchInput = document.getElementById('searchInput');
const composerDiv = document.getElementById('emailComposer');
const errorDiv = document.getElementById('error');
const loadingDiv = document.getElementById('loading');
const titleDisplay = document.getElementById('productTitleDisplay');
const authStatus = document.getElementById('authStatus');

// Form Fields
const emailToInput = document.getElementById('emailTo');
const subjectInput = document.getElementById('emailSubject');
const bodyInput = document.getElementById('emailBody');
const sendBtn = document.getElementById('sendBtn');


/* --- 1. DATA FETCHING --- */

async function fetchProducts() {
    loadingDiv.classList.remove('hidden');
    try {
        const response = await fetch(CSV_URL);
        const data = await response.text();
        parseCSV(data);
        loadingDiv.classList.add('hidden');
        window.gapi.load('client', initializeGapiClient);
    } catch (err) {
        console.error("Error fetching data:", err);
        loadingDiv.innerText = "Error loading database. Please ensure the sheet is published as CSV.";
    }
}

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

// Search Logic
searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim().toUpperCase();
    
    if (!query) {
        composerDiv.classList.add('hidden');
        errorDiv.classList.add('hidden');
        currentProductTitle = ''; // Clear title when search is empty
        return;
    }

    const match = products.find(p => p.id.toUpperCase() === query);

    if (match) {
        composerDiv.classList.remove('hidden');
        errorDiv.classList.add('hidden');
        
        // Update product title and set current subject reference
        currentProductTitle = match.title; 
        titleDisplay.textContent = currentProductTitle;

        subjectInput.value = currentProductTitle; // Set subject from search
        
        const messageTemplate = `Narito na ang ${match.type} mo, Grade ${match.grade} KasaMath. I-click mo lang ito: ${match.filePath}

Salamat sa pagsuporta sa TeXMathPro. Sa uulitin po!`;
        
        bodyInput.value = messageTemplate;

    } else {
        composerDiv.classList.add('hidden');
        if(query.length > 5) errorDiv.classList.remove('hidden');
        currentProductTitle = ''; // Clear reference if search fails
    }
});

// --- DEFENSIVE FIX: Prevent Recipient Email from changing the Subject ---
emailToInput.addEventListener('input', () => {
    // If the Subject input value does NOT match the last successfully searched ProductTitle,
    // force it to revert, thus preventing the recipient email input from overwriting it.
    if (subjectInput.value !== currentProductTitle && currentProductTitle !== '') {
        subjectInput.value = currentProductTitle;
    }
});


/* --- 2. GOOGLE AUTH & SENDING --- */

function initializeGapiClient() {
    window.gapi.client.init({
    }).then(function () {
        tokenClient = google.accounts.oauth2.initCodeClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: (response) => {
                if (response.error) {
                    console.error('Authorization failed:', response.error);
                    isLoggedIn = false;
                    authStatus.textContent = "Authorization failed.";
                } else {
                    isLoggedIn = true;
                    authStatus.textContent = "Signed in and ready to send.";
                    sendBtn.textContent = "Send Email";
                    sendBtn.disabled = false;
                }
            },
        });
    });
}

function authorizeAndSend() {
    tokenClient.callback = (response) => {
        if (response.error) {
             console.error('Authorization failed:', response.error);
             isLoggedIn = false;
             authStatus.textContent = "Authorization failed.";
        } else {
            isLoggedIn = true;
            authStatus.textContent = "Signed in and sending...";
            sendMail();
        }
    };
    
    if (!isLoggedIn) {
        tokenClient.requestAccessToken({prompt: 'consent'}); 
    } else {
        sendMail();
    }
}

function base64UrlEncode(str) {
    // Use the UTF-8 version of btoa for safe character encoding
    return btoa(unescape(encodeURIComponent(str))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function sendMail() {
    const recipient = emailToInput.value.trim();
    const subject = subjectInput.value.trim();
    const body = bodyInput.value;

    if (!recipient) {
        alert("Please enter a recipient email address.");
        return;
    }

    sendBtn.disabled = true;
    sendBtn.textContent = "Sending...";

    const emailLines = [];
    emailLines.push('To: ' + recipient);
    emailLines.push('Subject: ' + subject);
    emailLines.push('');
    emailLines.push(body);

    const email = emailLines.join('\r\n');
    const base64EncodedEmail = base64UrlEncode(email);

    const request = window.gapi.client.gmail.users.messages.send({
        'userId': 'me',
        'resource': {
            'raw': base64EncodedEmail
        }
    });

    request.execute(function(response) {
        sendBtn.disabled = false;
        if (response && response.id) {
            alert("Email sent successfully!");
            sendBtn.textContent = "Sent!";
            console.log('Email sent:', response);
        } else {
            alert("Error sending email. Check console for details.");
            sendBtn.textContent = "Send Email"; // Reset
            console.error('Send Error:', response);
        }
        
        setTimeout(() => {
            sendBtn.textContent = "Send Email";
        }, 3000);
    });
}

// Send Button Listener
sendBtn.addEventListener('click', authorizeAndSend);

// Initialize data loading
fetchProducts();
