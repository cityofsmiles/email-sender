const SHEET_ID = '1LaJ0Hq7V-GPoCupAk-sm1i3e2k4cuEbRpo7eLKoJ9SQ';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

// Google API Configuration
const CLIENT_ID = '219089573342-uk3i7n5pbc5b4vd0o620jr8jb1dl5rfh.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/gmail.send';

let products = [];
let tokenClient;
let isLoggedIn = false;

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
        // Start loading the Google API after data loads
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
        return;
    }

    const match = products.find(p => p.id.toUpperCase() === query);

    if (match) {
        composerDiv.classList.remove('hidden');
        errorDiv.classList.add('hidden');
        titleDisplay.textContent = match.title;

        subjectInput.value = match.title;
        
        const messageTemplate = `Narito na ang ${match.type} mo, Grade ${match.grade} KasaMath. I-click mo lang ito: ${match.filePath}

Salamat sa pagsuporta sa TeXMathPro. Sa uulitin po!`;
        
        bodyInput.value = messageTemplate;

    } else {
        composerDiv.classList.add('hidden');
        if(query.length > 5) errorDiv.classList.remove('hidden');
    }
});


/* --- 2. GOOGLE AUTH & SENDING --- */

/**
 * Initializes the Google API client and token client.
 */
function initializeGapiClient() {
    window.gapi.client.init({
        // We initialize without an API key since we're using OAuth for user scope
    }).then(function () {
        // Initialize token client for sign-in
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
                    sendBtn.textContent = "Send Email"; // Restore button text
                    sendBtn.disabled = false;
                }
            },
        });
    });
}

/**
 * Sends the request to authorize and get the token.
 */
function authorizeAndSend() {
    // If the user hasn't granted consent, open the consent flow
    tokenClient.callback = (response) => {
        if (response.error) {
             console.error('Authorization failed:', response.error);
             isLoggedIn = false;
             authStatus.textContent = "Authorization failed.";
        } else {
            isLoggedIn = true;
            authStatus.textContent = "Signed in and sending...";
            // Once authorized, proceed to send the email
            sendMail();
        }
    };
    
    if (!isLoggedIn) {
        // This initiates the OAuth flow in a popup
        tokenClient.requestAccessToken({prompt: 'consent'}); 
    } else {
        sendMail();
    }
}

/**
 * Helper function to convert text to Base64Url
 */
function base64UrlEncode(str) {
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Sends the actual email using the Gmail API.
 */
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
        
        // Reset button text after a delay
        setTimeout(() => {
            sendBtn.textContent = "Send Email";
        }, 3000);
    });
}

// Send Button Listener
sendBtn.addEventListener('click', authorizeAndSend);

// Initialize data loading
fetchProducts();
