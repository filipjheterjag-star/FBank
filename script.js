// DATABASE (sparad lokalt i webbläsaren)
let users = JSON.parse(localStorage.getItem('fbankUsers')) || {};
let currentUser = null;
let quickBalanceUser = null;

// GENERA KONTONUMMER
function generateAccountNumber() {
    return Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
}

// === SNABBSALDO FUNKTIONER ===
function showQuickBalanceModal() {
    document.getElementById('quickBalanceModal').classList.remove('hidden');
    document.getElementById('quickBalanceUsername').value = '';
    document.getElementById('quickBalanceUsername').focus();
}

function closeQuickBalanceModal() {
    document.getElementById('quickBalanceModal').classList.add('hidden');
}

function closeQuickBalanceResultModal() {
    document.getElementById('quickBalanceResultModal').classList.add('hidden');
}

function showQuickBalance() {
    const username = document.getElementById('quickBalanceUsername').value.trim();
    
    if (!username) {
        alert('Ange ett användarnamn');
        return;
    }
    
    if (!users[username]) {
        alert('Användaren finns inte');
        return;
    }
    
    quickBalanceUser = username;
    document.getElementById('quickBalanceAmount').textContent = users[username].balance.toLocaleString('sv-SE') + ' kr';
    document.getElementById('quickBalanceTime').textContent = 'Uppdaterat just nu';
    
    document.getElementById('quickBalanceModal').classList.add('hidden');
    document.getElementById('quickBalanceResultModal').classList.remove('hidden');
}

function addQuickBalance(amount) {
    if (quickBalanceUser) {
        users[quickBalanceUser].balance += amount;
        localStorage.setItem('fbankUsers', JSON.stringify(users));
        document.getElementById('quickBalanceAmount').textContent = users[quickBalanceUser].balance.toLocaleString('sv-SE') + ' kr';
        showSuccess('+' + amount + ' kr lagts till');
    }
}

// REGISTRERA NYT KONTO
function register() {
    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const password2 = document.getElementById('regPassword2').value;

    // VALIDERING
    if (!username || !email || !password || !password2) {
        showError('Alla fält måste fyllas i');
        return;
    }

    if (password !== password2) {
        showError('Lösenorden matchar inte');
        return;
    }

    if (password.length < 4) {
        showError('Lösenordet måste vara minst 4 tecken');
        return;
    }

    if (users[username]) {
        showError('Användarnamnet finns redan');
        return;
    }

    // SKAPA NYT KONTO
    users[username] = {
        email: email,
        password: password,
        balance: 1000,
        accountNumber: generateAccountNumber(),
        transactions: []
    };

    localStorage.setItem('fbankUsers', JSON.stringify(users));
    showError('');
    alert('Konto skapat! Du kan nu logga in.');
    toggleForms();
    
    // Töm formulär
    document.getElementById('regUsername').value = '';
    document.getElementById('regEmail').value = '';
    document.getElementById('regPassword').value = '';
    document.getElementById('regPassword2').value = '';
}

// LOGGA IN
function login() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!username || !password) {
        showError('Ange användarnamn och lösenord');
        return;
    }

    if (!users[username] || users[username].password !== password) {
        showError('Felaktigt användarnamn eller lösenord');
        return;
    }

    currentUser = username;
    quickBalanceUser = null;
    showError('');
    switchScreen('dashboardScreen');
    updateDashboard();
}

// LOGGA UT
function logout() {
    currentUser = null;
    quickBalanceUser = null;
    switchScreen('loginScreen');
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
    closeQuickBalanceModal();
    closeQuickBalanceResultModal();
}

// BYTA MELLAN LOGIN OCH REGISTRERA
function toggleForms() {
    document.getElementById('loginForm').classList.toggle('hidden');
    document.getElementById('registerForm').classList.toggle('hidden');
}

// BYTA SKÄRM
function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

// UPPDATERA DASHBOARD
function updateDashboard() {
    const user = users[currentUser];
    document.getElementById('userGreeting').textContent = `Hej, ${currentUser}!`;
    document.getElementById('balanceDisplay').textContent = user.balance.toLocaleString('sv-SE') + ' kr';
    document.getElementById('accountNumber').textContent = 'Kontonummer: ' + user.accountNumber;
    updateTransactionList();
}

// VISA ÖVERFÖRINGSFORMULÄR
function showTransferForm() {
    closeAllForms();
    document.getElementById('transferForm').classList.remove('hidden');
}

// VISA INSÄTTNINGSFORMULÄR
function showDepositForm() {
    closeAllForms();
    document.getElementById('depositForm').classList.remove('hidden');
}

// VISA UTTAGSFORMULÄR
function showWithdrawForm() {
    closeAllForms();
    document.getElementById('withdrawForm').classList.remove('hidden');
}

// VISA TRANSAKTIONSHISTORIK
function showTransactionHistory() {
    closeAllForms();
    document.getElementById('transactionHistory').classList.remove('hidden');
}

// STÄNG FORMULÄR
function closeForm() {
    closeAllForms();
}

function closeAllForms() {
    document.getElementById('transferForm').classList.add('hidden');
    document.getElementById('depositForm').classList.add('hidden');
    document.getElementById('withdrawForm').classList.add('hidden');
    document.getElementById('transactionHistory').classList.add('hidden');
}

// ÖVERFÖR PENGAR
function transferMoney() {
    const recipient = document.getElementById('recipientUsername').value.trim();
    const amount = parseFloat(document.getElementById('transferAmount').value);
    const message = document.getElementById('transferMessage').value;
    const user = users[currentUser];

    if (!recipient || !amount) {
        alert('Ange mottagare och belopp');
        return;
    }

    if (!users[recipient]) {
        alert('Mottagaren finns inte');
        return;
    }

    if (amount <= 0) {
        alert('Beloppet måste vara större än 0');
        return;
    }

    if (user.balance < amount) {
        alert('Du har inte tillräckligt med pengar');
        return;
    }

    // UTFÖR ÖVERFÖRING
    user.balance -= amount;
    users[recipient].balance += amount;

    // LÄGG TILL I TRANSAKTIONSHISTORIK
    const timestamp = new Date().toLocaleString('sv-SE');
    user.transactions.push({
        type: 'Överföring till ' + recipient,
        amount: -amount,
        timestamp: timestamp,
        message: message
    });

    users[recipient].transactions.push({
        type: 'Överföring från ' + currentUser,
        amount: amount,
        timestamp: timestamp,
        message: message
    });

    localStorage.setItem('fbankUsers', JSON.stringify(users));
    
    showSuccess(amount + ' kr skickades till ' + recipient);
    document.getElementById('recipientUsername').value = '';
    document.getElementById('transferAmount').value = '';
    document.getElementById('transferMessage').value = '';
    
    closeAllForms();
    updateDashboard();
}

// SÄTT IN PENGAR
function depositMoney() {
    const amount = parseFloat(document.getElementById('depositAmount').value);
    const user = users[currentUser];

    if (!amount || amount <= 0) {
        alert('Ange ett giltigt belopp');
        return;
    }

    user.balance += amount;
    const timestamp = new Date().toLocaleString('sv-SE');
    user.transactions.push({
        type: 'Insättning',
        amount: amount,
        timestamp: timestamp,
        message: ''
    });

    localStorage.setItem('fbankUsers', JSON.stringify(users));
    
    showSuccess('+' + amount + ' kr sattes in');
    document.getElementById('depositAmount').value = '';
    
    closeAllForms();
    updateDashboard();
}

// TA UT PENGAR
function withdrawMoney() {
    const amount = parseFloat(document.getElementById('withdrawAmount').value);
    const user = users[currentUser];

    if (!amount || amount <= 0) {
        alert('Ange ett giltigt belopp');
        return;
    }

    if (user.balance < amount) {
        alert('Du har inte tillräckligt med pengar');
        return;
    }

    user.balance -= amount;
    const timestamp = new Date().toLocaleString('sv-SE');
    user.transactions.push({
        type: 'Uttag',
        amount: -amount,
        timestamp: timestamp,
        message: ''
    });

    localStorage.setItem('fbankUsers', JSON.stringify(users));
    
    showSuccess('-' + amount + ' kr togs ut');
    document.getElementById('withdrawAmount').value = '';
    
    closeAllForms();
    updateDashboard();
}

// UPPDATERA TRANSAKTIONSLISTA
function updateTransactionList() {
    const user = users[currentUser];
    const list = document.getElementById('transactionList');
    
    if (user.transactions.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">Inga transaktioner än</p>';
        return;
    }

    list.innerHTML = user.transactions.reverse().map((trans, index) => {
        const isIncome = trans.amount > 0;
        return `
            <div class="transaction-item">
                <div class="transaction-info">
                    <div class="transaction-type">${trans.type}</div>
                    <div class="transaction-date">${trans.timestamp}</div>
                    ${trans.message ? '<div class="transaction-date">' + trans.message + '</div>' : ''}
                </div>
                <div class="transaction-amount ${isIncome ? 'income' : 'expense'}">
                    ${isIncome ? '+' : ''} ${trans.amount.toLocaleString('sv-SE')} kr
                </div>
            </div>
        `;
    }).join('');
}

// VISA FELMEDDELANDE
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    if (message) {
        errorDiv.textContent = message;
        errorDiv.classList.add('show');
    } else {
        errorDiv.classList.remove('show');
    }
}

// VISA FRAMGÅNGSMEDDELANDE
function showSuccess(message) {
    const successDiv = document.getElementById('successMessage');
    successDiv.textContent = message;
    successDiv.classList.add('show');
    
    setTimeout(() => {
        successDiv.classList.remove('show');
    }, 3000);
}

