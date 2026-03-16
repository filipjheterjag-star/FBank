// DATABASE (sparad lokalt i webbläsären)
let users = JSON.parse(localStorage.getItem('fbankUsers')) || {};
let currentUser = null;
let quickBalanceUser = null;
let stockPrices = JSON.parse(localStorage.getItem('stockPrices')) || {};
let stockHistory = JSON.parse(localStorage.getItem('stockHistory')) || {};
let currentBuyStock = null;
let currentSellStock = null;
let portfolioChart = null;

// SVENSKA AKTIER MED API
const stocks = [
    { ticker: 'AAPL', name: 'Apple Inc.', company: 'Apple' },
    { ticker: 'MSFT', name: 'Microsoft Corp.', company: 'Microsoft' },
    { ticker: 'GOOGL', name: 'Alphabet Inc.', company: 'Google' },
    { ticker: 'TSLA', name: 'Tesla Inc.', company: 'Tesla' },
    { ticker: 'NVDA', name: 'NVIDIA Corp.', company: 'NVIDIA' },
    { ticker: 'AMZN', name: 'Amazon.com Inc.', company: 'Amazon' },
    { ticker: 'META', name: 'Meta Platforms', company: 'Meta' },
    { ticker: 'NFLX', name: 'Netflix Inc.', company: 'Netflix' },
    { ticker: 'IBM', name: 'IBM Corp.', company: 'IBM' },
    { ticker: 'INTC', name: 'Intel Corp.', company: 'Intel' }
];

// GENERA KONTONUMMER
function generateAccountNumber() {
    return Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
}

// HÄMTA AKTIEPRISER
async function fetchStockPrices() {
    for (let stock of stocks) {
        if (!stockPrices[stock.ticker]) {
            const basePrice = Math.floor(Math.random() * 300) + 50;
            const change = (Math.random() - 0.5) * 10;
            stockPrices[stock.ticker] = {
                price: basePrice,
                change: change,
                lastUpdate: new Date().toLocaleTimeString('sv-SE')
            };
            stockHistory[stock.ticker] = [basePrice];
        }
    }
    localStorage.setItem('stockPrices', JSON.stringify(stockPrices));
    localStorage.setItem('stockHistory', JSON.stringify(stockHistory));
}

// UPPDATERA AKTIEPRISER
function updateStockPrices() {
    for (let stock of stocks) {
        if (stockPrices[stock.ticker]) {
            const change = (Math.random() - 0.5) * 2;
            stockPrices[stock.ticker].price += change;
            stockPrices[stock.ticker].price = Math.max(stockPrices[stock.ticker].price, 10);
            stockPrices[stock.ticker].change = change;
            stockPrices[stock.ticker].lastUpdate = new Date().toLocaleTimeString('sv-SE');
            
            // Lägg till i historik
            if (!stockHistory[stock.ticker]) {
                stockHistory[stock.ticker] = [];
            }
            stockHistory[stock.ticker].push(stockPrices[stock.ticker].price);
            
            // Håll bara de senaste 24 värdena
            if (stockHistory[stock.ticker].length > 24) {
                stockHistory[stock.ticker].shift();
            }
        }
    }
    localStorage.setItem('stockPrices', JSON.stringify(stockPrices));
    localStorage.setItem('stockHistory', JSON.stringify(stockHistory));
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

    users[username] = {
        email: email,
        password: password,
        balance: 10000,
        accountNumber: generateAccountNumber(),
        transactions: [],
        stocks: {}
    };

    localStorage.setItem('fbankUsers', JSON.stringify(users));
    showError('');
    alert('Konto skapat! Du kan nu logga in.');
    toggleForms();
    
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
    fetchStockPrices();
    displayStocks();
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

// BYTA TAB
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    
    document.getElementById(tabName + 'Tab').classList.add('active');
    event.target.classList.add('active');
    
    if (tabName === 'aktier') {
        updateStockPrices();
        displayStocks();
    }
}

// UPPDATERA DASHBOARD
function updateDashboard() {
    const user = users[currentUser];
    document.getElementById('userGreeting').textContent = `Hej, ${currentUser}!`;
    document.getElementById('balanceDisplay').textContent = user.balance.toLocaleString('sv-SE') + ' kr';
    document.getElementById('accountNumber').textContent = 'Kontonummer: ' + user.accountNumber;
    updateTransactionList();
}

// VISA AKTIER
function displayStocks() {
    const list = document.getElementById('stocksList');
    const user = users[currentUser];
    
    list.innerHTML = stocks.map(stock => {
        const price = stockPrices[stock.ticker] || { price: 0, change: 0 };
        const changeClass = price.change >= 0 ? 'up' : 'down';
        const changeSymbol = price.change >= 0 ? '▲' : '▼';
        const userOwns = user.stocks && user.stocks[stock.ticker] ? user.stocks[stock.ticker].quantity : 0;
        
        return `
            <div class="stock-card">
                <div class="stock-info">
                    <div class="stock-name">${stock.name}</div>
                    <div class="stock-ticker">${stock.ticker} ${userOwns > 0 ? `| Du äger: ${userOwns} st` : ''}</div>
                </div>
                <div class="stock-price-section">
                    <div class="stock-price">${price.price.toFixed(2)} kr</div>
                    <div class="stock-change ${changeClass}">${changeSymbol} ${Math.abs(price.change).toFixed(2)} kr</div>
                </div>
                <div class="stock-actions">
                    <button class="stock-action-btn btn-buy" onclick="openBuyStockModal('${stock.ticker}', '${stock.name}', ${price.price})">Köp</button>
                    ${userOwns > 0 ? `<button class="stock-action-btn btn-sell" onclick="openSellStockModal('${stock.ticker}', '${stock.name}', ${price.price})">Sälja</button>` : ''}
                </div>
            </div>
        `;
    }).join('');
    
    displayPortfolio();
}

// VISA PORTFÖLJÖ MED GRAF
function displayPortfolio() {
    const user = users[currentUser];
    const portfolioSection = document.getElementById('portfolioSection');
    const portfolioList = document.getElementById('portfolioList');
    const portfolioStats = document.getElementById('portfolioStats');
    
    if (!user.stocks || Object.keys(user.stocks).length === 0) {
        portfolioSection.classList.remove('show');
        return;
    }
    
    portfolioSection.classList.add('show');
    let totalValue = 0;
    let totalInvested = 0;
    let totalGain = 0;
    
    let html = '';
    for (let ticker in user.stocks) {
        const qty = user.stocks[ticker].quantity;
        const buyPrice = user.stocks[ticker].avgPrice;
        const currentPrice = stockPrices[ticker]?.price || buyPrice;
        const value = qty * currentPrice;
        const invested = qty * buyPrice;
        const gain = value - invested;
        const gainClass = gain >= 0 ? 'positive' : 'negative';
        
        totalValue += value;
        totalInvested += invested;
        totalGain += gain;
        
        const stock = stocks.find(s => s.ticker === ticker);
        
        html += `
            <div class="portfolio-item">
                <div class="portfolio-info">
                    <div class="portfolio-name">${stock.name}</div>
                    <div class="portfolio-qty">${qty} aktier @ ${buyPrice.toFixed(2)} kr</div>
                </div>
                <div class="portfolio-value">
                    <div class="portfolio-value-text">${value.toFixed(2)} kr</div>
                    <div class="portfolio-gain ${gainClass}">${gain >= 0 ? '+' : ''}${gain.toFixed(2)} kr (${((gain/invested)*100).toFixed(1)}%)</div>
                </div>
            </div>
        `;
    }
    
    portfolioList.innerHTML = html;
    
    // Visa statistik
    const gainPercent = totalInvested > 0 ? ((totalGain / totalInvested) * 100).toFixed(1) : 0;
    portfolioStats.innerHTML = `
        <div class="portfolio-stat">
            <div class="portfolio-stat-label">Investerat</div>
            <div class="portfolio-stat-value">${totalInvested.toFixed(2)} kr</div>
        </div>
        <div class="portfolio-stat">
            <div class="portfolio-stat-label">Nuvarande Värde</div>
            <div class="portfolio-stat-value">${totalValue.toFixed(2)} kr</div>
        </div>
        <div class="portfolio-stat">
            <div class="portfolio-stat-label">Vinst/Förlust</div>
            <div class="portfolio-stat-value ${totalGain >= 0 ? 'positive' : 'negative'}">${totalGain >= 0 ? '+' : ''}${totalGain.toFixed(2)} kr</div>
        </div>
        <div class="portfolio-stat">
            <div class="portfolio-stat-label">Förändring %</div>
            <div class="portfolio-stat-value ${totalGain >= 0 ? 'positive' : 'negative'}">${totalGain >= 0 ? '+' : ''}${gainPercent}%</div>
        </div>
    `;
    
    // Rita graf
    drawPortfolioChart();
}

// RITA PORTFÖLJÖGRAF
function drawPortfolioChart() {
    const user = users[currentUser];
    const ctx = document.getElementById('portfolioChart');
    
    if (!ctx) return;
    
    const data = {
        labels: stocks.filter(s => user.stocks && user.stocks[s.ticker]).map(s => s.ticker),
        datasets: [{
            label: 'Portföljavärde (kr)',
            data: stocks.filter(s => user.stocks && user.stocks[s.ticker]).map(s => {
                if (user.stocks[s.ticker]) {
                    const value = user.stocks[s.ticker].quantity * (stockPrices[s.ticker]?.price || user.stocks[s.ticker].avgPrice);
                    return value;
                }
                return 0;
            }),
            backgroundColor: [
                'rgba(0, 170, 68, 0.8)',
                'rgba(0, 146, 58, 0.8)',
                'rgba(0, 122, 48, 0.8)',
                'rgba(0, 98, 38, 0.8)',
                'rgba(52, 199, 89, 0.8)',
                'rgba(34, 197, 94, 0.8)',
                'rgba(16, 185, 129, 0.8)',
                'rgba(20, 184, 166, 0.8)',
                'rgba(34, 179, 172, 0.8)',
                'rgba(45, 212, 191, 0.8)'
            ],
            borderColor: '#00AA44',
            borderWidth: 2
        }]
    };
    
    if (portfolioChart) {
        portfolioChart.data = data;
        portfolioChart.update();
    } else {
        portfolioChart = new Chart(ctx, {
            type: 'pie',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: { family: "'Inter', sans-serif", size: 12, weight: 700 },
                            padding: 15
                        }
                    }
                }
            }
        });
    }
}

// KÖP AKTIE MODAL
function openBuyStockModal(ticker, name, price) {
    currentBuyStock = { ticker, name, price };
    document.getElementById('buyStockTitle').textContent = `Köp ${name}`;
    document.getElementById('buyStockPrice').textContent = `Pris: ${price.toFixed(2)} kr per aktie`;
    document.getElementById('buyStockQty').value = '1';
    updateBuyTotal();
    document.getElementById('buyStockModal').classList.remove('hidden');
}

function closeBuyStockModal() {
    document.getElementById('buyStockModal').classList.add('hidden');
}

function updateBuyTotal() {
    const qty = parseInt(document.getElementById('buyStockQty').value) || 0;
    const total = qty * currentBuyStock.price;
    document.getElementById('buyStockTotal').textContent = `Totalt: ${total.toFixed(2)} kr`;
}

function confirmBuyStock() {
    const qty = parseInt(document.getElementById('buyStockQty').value);
    const user = users[currentUser];
    const total = qty * currentBuyStock.price;
    
    if (qty <= 0) {
        alert('Ange en giltig mängd');
        return;
    }
    
    if (user.balance < total) {
        alert('Du har inte tillräckligt med pengar');
        return;
    }
    
    user.balance -= total;
    
    if (!user.stocks) user.stocks = {};
    if (!user.stocks[currentBuyStock.ticker]) {
        user.stocks[currentBuyStock.ticker] = { quantity: 0, avgPrice: 0 };
    }
    
    const oldQty = user.stocks[currentBuyStock.ticker].quantity;
    const oldCost = oldQty * user.stocks[currentBuyStock.ticker].avgPrice;
    const newQty = oldQty + qty;
    const newAvgPrice = (oldCost + total) / newQty;
    
    user.stocks[currentBuyStock.ticker].quantity = newQty;
    user.stocks[currentBuyStock.ticker].avgPrice = newAvgPrice;
    
    const timestamp = new Date().toLocaleString('sv-SE');
    user.transactions.push({
        type: `Köpt ${qty} st ${currentBuyStock.name}`,
        amount: -total,
        timestamp: timestamp,
        message: ''
    });
    
    localStorage.setItem('fbankUsers', JSON.stringify(users));
    closeBuyStockModal();
    showSuccess(`Köpte ${qty} st ${currentBuyStock.name}`);
    displayStocks();
    updateDashboard();
}

// SÄLJA AKTIE MODAL
function openSellStockModal(ticker, name, price) {
    const user = users[currentUser];
    const owned = user.stocks[ticker].quantity;
    const buyPrice = user.stocks[ticker].avgPrice;
    const gain = owned * (price - buyPrice);
    
    currentSellStock = { ticker, name, price, maxQty: owned, buyPrice, gain };
    document.getElementById('sellStockTitle').textContent = `Sälja ${name}`;
    document.getElementById('sellStockPrice').textContent = `Pris: ${price.toFixed(2)} kr per aktie (Du äger: ${owned} st)`;
    document.getElementById('sellStockQty').value = '1';
    document.getElementById('sellStockQty').max = owned;
    
    const gainClass = gain >= 0 ? 'positive' : 'negative';
    document.getElementById('sellStockGain').textContent = `Din totala vinst/förlust: ${gain >= 0 ? '+' : ''}${gain.toFixed(2)} kr (${((gain / (owned * buyPrice)) * 100).toFixed(1)}%)`;
    document.getElementById('sellStockGain').className = `stock-gain-info ${gainClass}`;
    
    updateSellTotal();
    document.getElementById('sellStockModal').classList.remove('hidden');
}

function closeSellStockModal() {
    document.getElementById('sellStockModal').classList.add('hidden');
}

function updateSellTotal() {
    const qty = parseInt(document.getElementById('sellStockQty').value) || 0;
    const total = qty * currentSellStock.price;
    const qtyGain = qty * (currentSellStock.price - currentSellStock.buyPrice);
    document.getElementById('sellStockTotal').textContent = `Du får: ${total.toFixed(2)} kr (Vinst: ${qtyGain >= 0 ? '+' : ''}${qtyGain.toFixed(2)} kr)`;
}

function confirmSellStock() {
    const qty = parseInt(document.getElementById('sellStockQty').value);
    const user = users[currentUser];
    const total = qty * currentSellStock.price;
    
    if (qty <= 0) {
        alert('Ange en giltig mängd');
        return;
    }
    
    if (qty > currentSellStock.maxQty) {
        alert('Du kan inte sälja mer än du äger');
        return;
    }
    
    user.balance += total;
    user.stocks[currentSellStock.ticker].quantity -= qty;
    
    if (user.stocks[currentSellStock.ticker].quantity === 0) {
        delete user.stocks[currentSellStock.ticker];
    }
    
    const timestamp = new Date().toLocaleString('sv-SE');
    user.transactions.push({
        type: `Såld ${qty} st ${currentSellStock.name}`,
        amount: total,
        timestamp: timestamp,
        message: ''
    });
    
    localStorage.setItem('fbankUsers', JSON.stringify(users));
    closeSellStockModal();
    showSuccess(`Sålde ${qty} st ${currentSellStock.name}`);
    displayStocks();
    updateDashboard();
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

    user.balance -= amount;
    users[recipient].balance += amount;

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
    
    showSuccess('Pengar överförda! ' + amount + ' kr skickades till ' + recipient);
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
    
    if (!user.transactions || user.transactions.length === 0) {
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

// Uppdatera köp/säljformulär dynamiskt
document.addEventListener('input', function(e) {
    if (e.target.id === 'buyStockQty') updateBuyTotal();
    if (e.target.id === 'sellStockQty') updateSellTotal();
});
