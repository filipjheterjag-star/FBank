// DATABASE (sparad lokalt i webbläsären)
let users = JSON.parse(localStorage.getItem('fbankUsers')) || {};
let currentUser = null;
let quickBalanceUser = null;
let stockPrices = JSON.parse(localStorage.getItem('stockPrices')) || {};
let stockHistory = JSON.parse(localStorage.getItem('stockHistory')) || {};
let currentBuyStock = null;
let currentSellStock = null;
let portfolioChart = null;

// SVENSKA AKTIER
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

function generateAccountNumber() {
    return Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
}

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

function updateStockPrices() {
    for (let stock of stocks) {
        if (stockPrices[stock.ticker]) {
            const change = (Math.random() - 0.5) * 2;
            stockPrices[stock.ticker].price += change;
            stockPrices[stock.ticker].price = Math.max(stockPrices[stock.ticker].price, 10);
            stockPrices[stock.ticker].change = change;
            stockPrices[stock.ticker].lastUpdate = new Date().toLocaleTimeString('sv-SE');
            
            if (!stockHistory[stock.ticker]) {
                stockHistory[stock.ticker] = [];
            }
            stockHistory[stock.ticker].push(stockPrices[stock.ticker].price);
            
            if (stockHistory[stock.ticker].length > 24) {
                stockHistory[stock.ticker].shift();
            }
        }
    }
    localStorage.setItem('stockPrices', JSON.stringify(stockPrices));
    localStorage.setItem('stockHistory', JSON.stringify(stockHistory));
}

function showQuickBalanceModal() {
    document.getElementById('quickBalanceModal').classList.remove('hidden');
    document.getElementById('quickBalanceUsername').value = '';
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

function logout() {
    currentUser = null;
    quickBalanceUser = null;
    switchScreen('loginScreen');
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
    closeQuickBalanceModal();
    closeQuickBalanceResultModal();
}

function toggleForms() {
    document.getElementById('loginForm').classList.toggle('hidden');
    document.getElementById('registerForm').classList.toggle('hidden');
}

function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

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

function updateDashboard() {
    const user = users[currentUser];
    document.getElementById('userGreeting').textContent = `${currentUser}`;
    document.getElementById('balanceDisplay').textContent = user.balance.toLocaleString('sv-SE') + ' kr';
    document.getElementById('accountNumber').textContent = user.accountNumber;
    updateTransactionList();
}

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
                <div>
                    <div class="portfolio-name">${stock.name}</div>
                    <div class="portfolio-qty">${qty} st @ ${buyPrice.toFixed(2)} kr</div>
                </div>
                <div>
                    <div class="portfolio-value-text">${value.toFixed(2)} kr</div>
                    <div class="portfolio-gain ${gainClass}">${gain >= 0 ? '+' : ''}${gain.toFixed(2)} kr</div>
                </div>
            </div>
        `;
    }
    
    portfolioList.innerHTML = html;
    
    const gainPercent = totalInvested > 0 ? ((totalGain / totalInvested) * 100).toFixed(1) : 0;
    portfolioStats.innerHTML = `
        <div class="portfolio-stat">
            <div class="portfolio-stat-label">Investerat</div>
            <div class="portfolio-stat-value">${totalInvested.toFixed(0)} kr</div>
        </div>
        <div class="portfolio-stat">
            <div class="portfolio-stat-label">Värde</div>
            <div class="portfolio-stat-value">${totalValue.toFixed(0)} kr</div>
        </div>
        <div class="portfolio-stat">
            <div class="portfolio-stat-label">Vinst</div>
            <div class="portfolio-stat-value ${totalGain >= 0 ? 'positive' : 'negative'}">${totalGain >= 0 ? '+' : ''}${totalGain.toFixed(0)} kr</div>
        </div>
        <div class="portfolio-stat">
            <div class="portfolio-stat-label">%</div>
            <div class="portfolio-stat-value ${totalGain >= 0 ? 'positive' : 'negative'}">${totalGain >= 0 ? '+' : ''}${gainPercent}%</div>
        </div>
    `;
    
    drawPortfolioChart();
}

function drawPortfolioChart() {
    const user = users[currentUser];
    const ctx = document.getElementById('portfolioChart');
    
    if (!ctx) return;
    
    const data = {
        labels: stocks.filter(s => user.stocks && user.stocks[s.ticker]).map(s => s.ticker),
        datasets: [{
            label: 'Portföljävärde',
            data: stocks.filter(s => user.stocks && user.stocks[s.ticker]).map(s => {
                if (user.stocks[s.ticker]) {
                    const value = user.stocks[s.ticker].quantity * (stockPrices[s.ticker]?.price || user.stocks[s.ticker].avgPrice);
                    return value;
                }
                return 0;
            }),
            backgroundColor: [
                '#00AA44', '#FF6B35', '#00923A', '#E67E22', '#34C759',
                '#3498DB', '#9B59B6', '#E74C3C', '#1ABC9C', '#F39C12'
            ],
            borderWidth: 0
        }]
    };
    
    if (portfolioChart) {
        portfolioChart.data = data;
        portfolioChart.update();
    } else {
        portfolioChart = new Chart(ctx, {
            type: 'doughnut',
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

function openBuyStockModal(ticker, name, price) {
    currentBuyStock = { ticker, name, price };
    document.getElementById('buyStockTitle').textContent = `Köp ${name}`;
    document.getElementById('buyStockPrice').textContent = `Pris: ${price.toFixed(2)} kr/st`;
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

function openSellStockModal(ticker, name, price) {
    const user = users[currentUser];
    const owned = user.stocks[ticker].quantity;
    const buyPrice = user.stocks[ticker].avgPrice;
    const gain = owned * (price - buyPrice);
    
    currentSellStock = { ticker, name, price, maxQty: owned, buyPrice, gain };
    document.getElementById('sellStockTitle').textContent = `Sälja ${name}`;
    document.getElementById('sellStockPrice').textContent = `Pris: ${price.toFixed(2)} kr/st`;
    document.getElementById('sellStockQty').value = '1';
    document.getElementById('sellStockQty').max = owned;
    
    const gainClass = gain >= 0 ? 'positive' : 'negative';
    document.getElementById('sellStockGain').textContent = `Potentiell vinst: ${gain >= 0 ? '+' : ''}${gain.toFixed(2)} kr`;
    document.getElementById('sellStockGain').className = `modal-gain ${gainClass}`;
    
    updateSellTotal();
    document.getElementById('sellStockModal').classList.remove('hidden');
}

function closeSellStockModal() {
    document.getElementById('sellStockModal').classList.add('hidden');
}

function updateSellTotal() {
    const qty = parseInt(document.getElementById('sellStockQty').value) || 0;
    const total = qty * currentSellStock.price;
    document.getElementById('sellStockTotal').textContent = `Du får: ${total.toFixed(2)} kr`;
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

function showTransferForm() {
    closeAllForms();
    document.getElementById('transferForm').classList.remove('hidden');
}

function showDepositForm() {
    closeAllForms();
    document.getElementById('depositForm').classList.remove('hidden');
}

function showWithdrawForm() {
    closeAllForms();
    document.getElementById('withdrawForm').classList.remove('hidden');
}

function showTransactionHistory() {
    closeAllForms();
    document.getElementById('transactionHistory').classList.remove('hidden');
}

function closeForm() {
    closeAllForms();
}

function closeAllForms() {
    document.getElementById('transferForm').classList.add('hidden');
    document.getElementById('depositForm').classList.add('hidden');
    document.getElementById('withdrawForm').classList.add('hidden');
    document.getElementById('transactionHistory').classList.add('hidden');
}

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
    
    showSuccess('Pengar överförda!');
    document.getElementById('recipientUsername').value = '';
    document.getElementById('transferAmount').value = '';
    document.getElementById('transferMessage').value = '';
    
    closeAllForms();
    updateDashboard();
}

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

function updateTransactionList() {
    const user = users[currentUser];
    const list = document.getElementById('transactionList');
    
    if (!user.transactions || user.transactions.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">Inga transaktioner än</p>';
        return;
    }

    list.innerHTML = user.transactions.reverse().map((trans) => {
        const isIncome = trans.amount > 0;
        return `
            <div class="transaction-item">
                <div class="transaction-info">
                    <div class="transaction-type">${trans.type}</div>
                    <div class="transaction-date">${trans.timestamp}</div>
                </div>
                <div class="transaction-amount ${isIncome ? 'income' : 'expense'}">
                    ${isIncome ? '+' : ''} ${trans.amount.toLocaleString('sv-SE')} kr
                </div>
            </div>
        `;
    }).join('');
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    if (message) {
        errorDiv.textContent = message;
        errorDiv.classList.add('show');
    } else {
        errorDiv.classList.remove('show');
    }
}

function showSuccess(message) {
    const successDiv = document.getElementById('successMessage');
    successDiv.textContent = message;
    successDiv.classList.add('show');
    
    setTimeout(() => {
        successDiv.classList.remove('show');
    }, 3000);
}

document.addEventListener('input', function(e) {
    if (e.target.id === 'buyStockQty') updateBuyTotal();
    if (e.target.id === 'sellStockQty') updateSellTotal();
});
