let users = JSON.parse(localStorage.getItem('fbankUsers')) || {};
let currentUser = null;
let quickBalanceUser = null;
let stockPrices = JSON.parse(localStorage.getItem('stockPrices')) || {};
let stockHistory = JSON.parse(localStorage.getItem('stockHistory')) || {};
let currentBuyStock = null;
let currentSellStock = null;
let portfolioChart = null;
let budgetChart = null;

const stocks = [
    { ticker: 'AAPL', name: 'Apple Inc.' },
    { ticker: 'MSFT', name: 'Microsoft Corp.' },
    { ticker: 'GOOGL', name: 'Alphabet Inc.' },
    { ticker: 'TSLA', name: 'Tesla Inc.' },
    { ticker: 'NVDA', name: 'NVIDIA Corp.' },
    { ticker: 'AMZN', name: 'Amazon.com Inc.' },
    { ticker: 'META', name: 'Meta Platforms' },
    { ticker: 'NFLX', name: 'Netflix Inc.' },
    { ticker: 'IBM', name: 'IBM Corp.' },
    { ticker: 'INTC', name: 'Intel Corp.' }
];

const achievements = [
    { id: 'first_deposit', name: 'Första Insättning', icon: '💰', condition: (u) => u.transactions?.some(t => t.type === 'Insättning') },
    { id: 'first_stock', name: 'Första Aktie', icon: '📈', condition: (u) => Object.keys(u.stocks || {}).length > 0 },
    { id: 'rich', name: 'Rik Person', icon: '💵', condition: (u) => u.balance >= 50000 },
    { id: 'investor', name: 'Investerare', icon: '🎯', condition: (u) => (u.stocks && Object.values(u.stocks).reduce((s, st) => s + st.quantity, 0) >= 10) },
    { id: 'saver', name: 'Sparare', icon: '🏦', condition: (u) => (u.goals && u.goals.length > 0) },
    { id: 'friend', name: 'Social', icon: '👥', condition: (u) => (u.friends && u.friends.length > 0) }
];

function generateAccountNumber() {
    return Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
}

function fetchStockPrices() {
    for (let stock of stocks) {
        if (!stockPrices[stock.ticker]) {
            const basePrice = Math.floor(Math.random() * 300) + 50;
            stockPrices[stock.ticker] = {
                price: basePrice,
                change: 0,
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

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    document.getElementById('loginScreen').classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

function loadDarkMode() {
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        document.getElementById('loginScreen').classList.add('dark-mode');
    }
}

function showSettings() {
    document.getElementById('settingsModal').classList.remove('hidden');
}

function closeSettings() {
    document.getElementById('settingsModal').classList.add('hidden');
}

function saveSettings() {
    const language = document.getElementById('languageSetting').value;
    const currency = document.getElementById('currencySetting').value;
    const notifications = document.getElementById('notificationsSetting').checked;
    
    if (currentUser) {
        users[currentUser].settings = { language, currency, notifications };
        localStorage.setItem('fbankUsers', JSON.stringify(users));
    }
    
    closeSettings();
    showSuccess('Inställningar sparade!');
}

function showQuickBalanceModal() {
    document.getElementById('quickBalanceModal').classList.remove('hidden');
}

function closeQuickBalanceModal() {
    document.getElementById('quickBalanceModal').classList.add('hidden');
}

function closeQuickBalanceResultModal() {
    document.getElementById('quickBalanceResultModal').classList.add('hidden');
}

function showQuickBalance() {
    const username = document.getElementById('quickBalanceUsername').value.trim();
    
    if (!username || !users[username]) {
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

function giveDaily Bonus() {
    if (!currentUser) return;
    const user = users[currentUser];
    const today = new Date().toDateString();
    
    if (user.lastBonusDate !== today) {
        user.balance += 1;
        user.lastBonusDate = today;
        localStorage.setItem('fbankUsers', JSON.stringify(users));
        updateDashboard();
        return true;
    }
    return false;
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
        stocks: {},
        goals: [],
        friends: [],
        recurring: [],
        avatar: '👤',
        lastBonusDate: null,
        budget: { monthly: 50000, perTransaction: 100000 },
        settings: { language: 'sv', currency: 'SEK', notifications: true }
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
    
    if (giveDailyBonus()) {
        showSuccess('✨ +1 kr daglig bonus!');
    }
}

function logout() {
    currentUser = null;
    switchScreen('loginScreen');
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
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
    } else if (tabName === 'budget') {
        displayBudget();
    } else if (tabName === 'profil') {
        displayProfile();
    } else if (tabName === 'sparmal') {
        displayGoals();
    }
}

function updateDashboard() {
    const user = users[currentUser];
    document.getElementById('userGreeting').textContent = `${currentUser}`;
    document.getElementById('balanceDisplay').textContent = user.balance.toLocaleString('sv-SE') + ' kr';
    document.getElementById('accountNumber').textContent = user.accountNumber;
    
    const today = new Date().toDateString();
    if (user.lastBonusDate === today) {
        document.getElementById('dailyBonus').textContent = '✓ Bonus mottagen';
    } else {
        document.getElementById('dailyBonus').textContent = '✨ Daglig bonus väntar';
    }
    
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
                        labels: { font: { size: 12, weight: 700 }, padding: 15 }
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
    
    if (qty <= 0 || user.balance < total) {
        alert('Ogiltigt belopp eller otillräcklig balans');
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
    
    if (qty <= 0 || qty > currentSellStock.maxQty) {
        alert('Ogiltigt belopp');
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

function showRecurringForm() {
    closeAllForms();
    document.getElementById('recurringForm').classList.remove('hidden');
    displayRecurringList();
}

function showFriendsModal() {
    document.getElementById('friendsModal').classList.remove('hidden');
    displayFriendsList();
}

function closeFriendsModal() {
    document.getElementById('friendsModal').classList.add('hidden');
}

function closeForm() {
    closeAllForms();
}

function closeAllForms() {
    document.getElementById('transferForm').classList.add('hidden');
    document.getElementById('depositForm').classList.add('hidden');
    document.getElementById('withdrawForm').classList.add('hidden');
    document.getElementById('transactionHistory').classList.add('hidden');
    document.getElementById('recurringForm').classList.add('hidden');
}

function transferMoney() {
    const recipient = document.getElementById('recipientUsername').value.trim();
    const amount = parseFloat(document.getElementById('transferAmount').value);
    const message = document.getElementById('transferMessage').value;
    const user = users[currentUser];

    if (!recipient || !amount || !users[recipient] || amount <= 0 || user.balance < amount) {
        alert('Felaktig överföring');
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
        alert('Ogiltigt belopp');
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

    if (!amount || amount <= 0 || user.balance < amount) {
        alert('Ogiltigt belopp');
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

function addRecurringTransfer() {
    const recipient = document.getElementById('recurringRecipient').value.trim();
    const amount = parseFloat(document.getElementById('recurringAmount').value);
    const frequency = document.getElementById('recurringFrequency').value;
    const user = users[currentUser];
    
    if (!recipient || !amount || !users[recipient]) {
        alert('Felaktig mottagare eller belopp');
        return;
    }
    
    if (!user.recurring) user.recurring = [];
    user.recurring.push({ recipient, amount, frequency, active: true });
    
    localStorage.setItem('fbankUsers', JSON.stringify(users));
    showSuccess('Återkurrande överföring tillagd');
    
    document.getElementById('recurringRecipient').value = '';
    document.getElementById('recurringAmount').value = '';
    
    displayRecurringList();
}

function displayRecurringList() {
    const user = users[currentUser];
    const list = document.getElementById('recurringList');
    
    if (!user.recurring || user.recurring.length === 0) {
        list.innerHTML = '<p style="color: #999; font-size: 13px;">Inga återkurrande överföringar</p>';
        return;
    }
    
    list.innerHTML = user.recurring.map((r, i) => `
        <div class="recurring-item">
            <div>
                <strong>${r.recipient}</strong> - ${r.amount} kr / ${r.frequency === 'weekly' ? 'vecka' : 'månad'}
            </div>
            <button class="btn-icon" onclick="removeRecurring(${i})" style="color: #FF3B30;">✕</button>
        </div>
    `).join('');
}

function removeRecurring(index) {
    const user = users[currentUser];
    user.recurring.splice(index, 1);
    localStorage.setItem('fbankUsers', JSON.stringify(users));
    displayRecurringList();
}

function addFriend() {
    const username = document.getElementById('addFriendUsername').value.trim();
    const user = users[currentUser];
    
    if (!username || !users[username] || username === currentUser) {
        alert('Felaktig användare');
        return;
    }
    
    if (!user.friends) user.friends = [];
    if (user.friends.includes(username)) {
        alert('Redan vän');
        return;
    }
    
    user.friends.push(username);
    localStorage.setItem('fbankUsers', JSON.stringify(users));
    showSuccess('Vän tillagd!');
    
    document.getElementById('addFriendUsername').value = '';
    displayFriendsList();
}

function displayFriendsList() {
    const user = users[currentUser];
    const list = document.getElementById('friendsList');
    
    if (!user.friends || user.friends.length === 0) {
        list.innerHTML = '<p style="color: #999; font-size: 13px;">Inga vänner än</p>';
        return;
    }
    
    list.innerHTML = user.friends.map((friend, i) => `
        <div class="friend-item">
            <div>
                <strong>${friend}</strong> - Saldo: ${users[friend].balance.toLocaleString('sv-SE')} kr
            </div>
            <button class="btn-icon" onclick="removeFriend(${i})" style="color: #FF3B30;">✕</button>
        </div>
    `).join('');
}

function removeFriend(index) {
    const user = users[currentUser];
    user.friends.splice(index, 1);
    localStorage.setItem('fbankUsers', JSON.stringify(users));
    displayFriendsList();
}

function updateTransactionList() {
    const user = users[currentUser];
    const list = document.getElementById('transactionList');
    
    if (!user.transactions || user.transactions.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">Inga transaktioner än</p>';
        return;
    }

    list.innerHTML = user.transactions.slice().reverse().map((trans) => {
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

// SPARMÅL
function createGoal() {
    const name = document.getElementById('goalName').value.trim();
    const amount = parseFloat(document.getElementById('goalAmount').value);
    const current = parseFloat(document.getElementById('goalCurrent').value) || 0;
    const user = users[currentUser];
    
    if (!name || !amount || amount <= 0) {
        alert('Felaktiga värden');
        return;
    }
    
    if (!user.goals) user.goals = [];
    user.goals.push({ name, target: amount, current, createdDate: new Date().toLocaleString('sv-SE') });
    
    localStorage.setItem('fbankUsers', JSON.stringify(users));
    showSuccess('Sparmål skapat!');
    
    document.getElementById('goalName').value = '';
    document.getElementById('goalAmount').value = '';
    document.getElementById('goalCurrent').value = '';
    
    displayGoals();
}

function displayGoals() {
    const user = users[currentUser];
    const list = document.getElementById('goalsList');
    
    if (!user.goals || user.goals.length === 0) {
        list.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">Inga sparmål än</p>';
        return;
    }
    
    list.innerHTML = user.goals.map((goal, i) => {
        const progress = (goal.current / goal.target) * 100;
        return `
            <div class="goal-card">
                <div class="goal-name">${goal.name}</div>
                <div class="goal-progress-bar">
                    <div class="goal-progress-fill" style="width: ${progress}%"></div>
                </div>
                <div class="goal-info">
                    <span>${goal.current.toLocaleString('sv-SE')} kr / ${goal.target.toLocaleString('sv-SE')} kr</span>
                    <span>${progress.toFixed(0)}%</span>
                </div>
                <div class="goal-actions">
                    <button class="goal-add-btn" onclick="addToGoal(${i})">+ Lägg Till</button>
                    <button class="goal-delete-btn" onclick="removeGoal(${i})">Ta Bort</button>
                </div>
            </div>
        `;
    }).join('');
}

function addToGoal(index) {
    const amount = prompt('Hur mycket vill du spara?');
    if (!amount || isNaN(amount)) return;
    
    const user = users[currentUser];
    const goal = user.goals[index];
    
    goal.current += parseFloat(amount);
    if (goal.current >= goal.target) {
        showSuccess('🎉 Grattis! Du nådde ditt sparmål!');
        goal.completed = new Date().toLocaleString('sv-SE');
    }
    
    localStorage.setItem('fbankUsers', JSON.stringify(users));
    displayGoals();
}

function removeGoal(index) {
    const user = users[currentUser];
    user.goals.splice(index, 1);
    localStorage.setItem('fbankUsers', JSON.stringify(users));
    displayGoals();
}

// BUDGET
function setBudget() {
    const monthly = parseFloat(document.getElementById('budgetLimit').value);
    const perTransaction = parseFloat(document.getElementById('transactionLimit').value);
    const user = users[currentUser];
    
    if (!monthly || !perTransaction) {
        alert('Fyll i alla värden');
        return;
    }
    
    user.budget = { monthly, perTransaction };
    localStorage.setItem('fbankUsers', JSON.stringify(users));
    showSuccess('Budget sparad!');
    displayBudget();
}

function displayBudget() {
    const user = users[currentUser];
    const budget = user.budget || { monthly: 50000, perTransaction: 100000 };
    
    // Räkna utgifter denna månad
    const thisMonth = new Date();
    const expenses = (user.transactions || [])
        .filter(t => new Date(t.timestamp).getMonth() === thisMonth.getMonth())
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const percentUsed = (expenses / budget.monthly) * 100;
    
    document.getElementById('budgetStats').innerHTML = `
        <div class="budget-stat">
            <div class="budget-stat-label">Månadsgräns</div>
            <div class="budget-stat-value">${budget.monthly.toLocaleString('sv-SE')} kr</div>
        </div>
        <div class="budget-stat">
            <div class="budget-stat-label">Utgifter</div>
            <div class="budget-stat-value">${expenses.toLocaleString('sv-SE')} kr</div>
        </div>
        <div class="budget-stat">
            <div class="budget-stat-label">Kvar</div>
            <div class="budget-stat-value">${(budget.monthly - expenses).toLocaleString('sv-SE')} kr</div>
        </div>
        <div class="budget-stat">
            <div class="budget-stat-label">Använd</div>
            <div class="budget-stat-value">${percentUsed.toFixed(0)}%</div>
        </div>
    `;
    
    // Räkna utgifter per kategori
    const categories = {};
    (user.transactions || []).forEach(t => {
        const type = t.type.split(' ')[0];
        if (t.amount < 0) {
            categories[type] = (categories[type] || 0) + Math.abs(t.amount);
        }
    });
    
    drawBudgetChart(categories);
    
    // Månadsrapport
    document.getElementById('monthlyReport').innerHTML = `
        <p><strong>Månad:</strong> ${new Date().toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' })}</p>
        <p><strong>Totala transaktioner:</strong> ${user.transactions?.length || 0}</p>
        <p><strong>Totala inkomster:</strong> +${(user.transactions || []).filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0).toLocaleString('sv-SE')} kr</p>
        <p><strong>Totala utgifter:</strong> -${expenses.toLocaleString('sv-SE')} kr</p>
        <p><strong>Netto denna månad:</strong> ${((user.transactions || []).filter(t => new Date(t.timestamp).getMonth() === thisMonth.getMonth()).reduce((s, t) => s + t.amount, 0)).toLocaleString('sv-SE')} kr</p>
    `;
}

function drawBudgetChart(categories) {
    const ctx = document.getElementById('budgetChart');
    if (!ctx) return;
    
    const data = {
        labels: Object.keys(categories),
        datasets: [{
            label: 'Utgifter',
            data: Object.values(categories),
            backgroundColor: ['#FF6B35', '#00AA44', '#34C759', '#FF3B30', '#3498DB'],
            borderWidth: 0
        }]
    };
    
    if (budgetChart) {
        budgetChart.data = data;
        budgetChart.update();
    } else {
        budgetChart = new Chart(ctx, {
            type: 'bar',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }
}

function downloadReport() {
    const user = users[currentUser];
    const report = `FBank Rapport - ${currentUser}\n\n${document.getElementById('monthlyReport').innerText}\n\nTransaktioner:\n${(user.transactions || []).map(t => `${t.timestamp}: ${t.type} - ${t.amount} kr`).join('\n')}`;
    
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fbank_rapport_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
}

// PROFIL
function updateAvatar() {
    const emoji = document.getElementById('avatarEmoji').value.trim();
    if (emoji) {
        users[currentUser].avatar = emoji;
        localStorage.setItem('fbankUsers', JSON.stringify(users));
        displayProfile();
        showSuccess('Avatar uppdaterad!');
    }
}

function displayProfile() {
    const user = users[currentUser];
    document.getElementById('userAvatar').textContent = user.avatar;
    document.getElementById('profileUsername').textContent = currentUser;
    document.getElementById('profileEmail').textContent = user.email;
    document.getElementById('profileAccounts').textContent = user.accountNumber;
    
    displayAchievements();
    displayLeaderboard();
}

function displayAchievements() {
    const user = users[currentUser];
    const list = document.getElementById('achievementsList');
    
    list.innerHTML = achievements.map(a => {
        const unlocked = a.condition(user);
        return `
            <div class="achievement-badge ${unlocked ? '' : 'locked'}" title="${a.name}">
                <div class="achievement-icon">${a.icon}</div>
                <div class="achievement-name">${a.name}</div>
            </div>
        `;
    }).join('');
}

function displayLeaderboard() {
    const leaderboard = Object.entries(users)
        .map(([name, u]) => ({
            name,
            gain: Object.values(u.stocks || {}).reduce((s, st) => s + (st.quantity * (stockPrices[Object.keys(u.stocks || {})[Object.values(u.stocks || {}).indexOf(st)]?.] || st.avgPrice)), 0)
        }))
        .sort((a, b) => b.gain - a.gain)
        .slice(0, 10);
    
    const list = document.getElementById('leaderboardList');
    list.innerHTML = leaderboard.map((item, i) => {
        const rankClass = i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : '';
        return `
            <div class="leaderboard-item">
                <div class="leaderboard-rank ${rankClass}">${i + 1}</div>
                <div class="leaderboard-info">
                    <div class="leaderboard-name">${item.name}${item.name === currentUser ? ' (Du)' : ''}</div>
                </div>
                <div class="leaderboard-gain">+${item.gain.toFixed(0)} kr</div>
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

// Initiera
loadDarkMode();
