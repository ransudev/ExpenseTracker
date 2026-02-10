const balanceEl = document.getElementById("balance");
const incomeAmountEl = document.getElementById("income-amount");
const expenseAmountEl = document.getElementById("expense-amount");
const transactionListEl = document.getElementById("transaction-list");
const transactionFormEl = document.getElementById("transaction-form");
const descriptionEl = document.getElementById("description");
const amountEl = document.getElementById("amount");
const dateEl = document.getElementById("date");
const categoryEl = document.getElementById("category");
const submitBtnEl = document.getElementById("submit-btn");
const cancelEditBtnEl = document.getElementById("cancel-edit-btn");

// Search, Filter, and Sort elements
const searchInputEl = document.getElementById("search-input");
const categoryFilterEl = document.getElementById("category-filter");
const dateFilterEl = document.getElementById("date-filter");
const sortSelectEl = document.getElementById("sort-select");
const resultsCountEl = document.getElementById("results-count");
const clearFiltersEl = document.getElementById("clear-filters");

let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
// State for tracking which transaction is being edited
let editingTransactionId = null;

// State for filters and sorting
let currentFilters = {
    search: "",
    category: "all",
    dateRange: "all",
    sort: "date-desc"
};

transactionFormEl.addEventListener("submit", addTransaction);
// Event listener for cancel edit button
cancelEditBtnEl.addEventListener("click", cancelEdit);

// Event delegation for edit and delete buttons
transactionListEl.addEventListener("click", handleTransactionClick);

// Event listeners for search, filter, and sort
searchInputEl.addEventListener("input", handleSearchInput);
categoryFilterEl.addEventListener("change", handleCategoryFilter);
dateFilterEl.addEventListener("change", handleDateFilter);
sortSelectEl.addEventListener("change", handleSortChange);
clearFiltersEl.addEventListener("click", clearAllFilters);

function addTransaction(e){
e.preventDefault();

const description = descriptionEl.value.trim();
const amount = parseFloat(amountEl.value);
const date = dateEl.value;
const category = categoryEl.value.trim();

// Check if we're editing or adding new transaction
if (editingTransactionId !== null) {
    // Update existing transaction
    const transactionIndex = transactions.findIndex(t => t.id === editingTransactionId);
    if (transactionIndex !== -1) {
        transactions[transactionIndex] = {
            ...transactions[transactionIndex],
            description,
            amount,
            date,
            category
        };
    }
    editingTransactionId = null;
    submitBtnEl.textContent = "Add Transaction";
    cancelEditBtnEl.style.display = "none";
} else {
    // Add new transaction
    transactions.push({
        id: Date.now(),
        description,
        amount,
        date,
        category
    });
}

localStorage.setItem("transactions", JSON.stringify(transactions));

updateTransactionList();
updateSummary();
updateCategoryFilter(); // Update category dropdown

transactionFormEl.reset();
// Set date to today by default
dateEl.value = new Date().toISOString().split('T')[0];
}

function updateTransactionList(){
transactionListEl.innerHTML = "";

// Get filtered and sorted transactions
let displayTransactions = getFilteredAndSortedTransactions();

displayTransactions.forEach(transaction => {
    const transactionEl = createTransactionElement(transaction);
    transactionListEl.appendChild(transactionEl);
});

// Update results count
updateResultsCount(displayTransactions.length);
}

// Get filtered and sorted transactions
function getFilteredAndSortedTransactions() {
let filtered = [...transactions];

// Apply search filter
if (currentFilters.search) {
    const searchLower = currentFilters.search.toLowerCase();
    filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(searchLower) ||
        (t.category && t.category.toLowerCase().includes(searchLower))
    );
}

// Apply category filter
if (currentFilters.category !== "all") {
    filtered = filtered.filter(t => {
        if (currentFilters.category === "uncategorized") {
            return !t.category || t.category.trim() === "";
        }
        return t.category === currentFilters.category;
    });
}

// Apply date range filter
if (currentFilters.dateRange !== "all") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    filtered = filtered.filter(t => {
        if (!t.date) return false;
        const transactionDate = new Date(t.date);
        transactionDate.setHours(0, 0, 0, 0);
        
        if (currentFilters.dateRange === "today") {
            return transactionDate.getTime() === today.getTime();
        } else if (currentFilters.dateRange === "week") {
            // Calendar-based: Start of current week (Sunday) to end of week (Saturday)
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay()); // Go back to Sunday
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
            endOfWeek.setHours(23, 59, 59, 999);
            return transactionDate >= startOfWeek && transactionDate <= endOfWeek;
        } else if (currentFilters.dateRange === "month") {
            // Calendar-based: First day to last day of current month
            const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            firstOfMonth.setHours(0, 0, 0, 0);
            const lastOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            lastOfMonth.setHours(23, 59, 59, 999);
            return transactionDate >= firstOfMonth && transactionDate <= lastOfMonth;
        }
        return true;
    });
}

// Apply sorting
filtered.sort((a, b) => {
    switch (currentFilters.sort) {
        case "date-desc":
            return new Date(b.date || 0) - new Date(a.date || 0);
        case "date-asc":
            return new Date(a.date || 0) - new Date(b.date || 0);
        case "amount-desc":
            return Math.abs(b.amount) - Math.abs(a.amount);
        case "amount-asc":
            return Math.abs(a.amount) - Math.abs(b.amount);
        case "name-asc":
            return a.description.localeCompare(b.description);
        case "name-desc":
            return b.description.localeCompare(a.description);
        default:
            return new Date(b.date || 0) - new Date(a.date || 0);
    }
});

return filtered;
}

// transaction = {id:asdsa, description:asdsad, amount: asdsad, date: asdsad, category: asdsad}
// transaction.amount
function createTransactionElement(transaction){
const li = document.createElement("li");
li.classList.add("transaction");
li.classList.add(transaction.amount > 0 ? "income" : "expense");
li.dataset.id = transaction.id; // Store ID for event delegation

// Format date if available
const dateDisplay = transaction.date ? 
    new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 
    '';

// Create category chip if category exists
const categoryChip = transaction.category ? 
    `<span class="category-chip">${transaction.category}</span>` : 
    '';

li.innerHTML = `
    <div class="transaction-info">
        <span class="transaction-description">${transaction.description}</span>
        ${categoryChip}
        ${dateDisplay ? `<span class="transaction-date">${dateDisplay}</span>` : ''}
    </div>
    <div class="transaction-actions">
        <span class="transaction-amount">${formatCurrency(transaction.amount)}</span>
        <button class="edit-btn" data-id="${transaction.id}">
            <i class="fa-solid fa-pen-to-square"></i>
        </button>
        <button class="delete-btn" data-id="${transaction.id}">
            <i class="fa-solid fa-trash"></i>
        </button>
    </div>
`;

return li;
}

function formatCurrency(amount){
return new Intl.NumberFormat("en-US", {
style: "currency",
currency: "USD"
}).format(amount);
}

// Event delegation handler for edit and delete buttons
function handleTransactionClick(e) {
const deleteBtn = e.target.closest('.delete-btn');
const editBtn = e.target.closest('.edit-btn');
    
if (deleteBtn) {
    const id = parseInt(deleteBtn.dataset.id);
    removeTransaction(id);
} else if (editBtn) {
    const id = parseInt(editBtn.dataset.id);
    editTransaction(id);
}
}

// Edit transaction function
function editTransaction(id) {
const transaction = transactions.find(t => t.id === id);
if (!transaction) return;

// Populate form with transaction data
descriptionEl.value = transaction.description;
amountEl.value = transaction.amount;
dateEl.value = transaction.date || '';
categoryEl.value = transaction.category || '';

// Update UI for editing mode
editingTransactionId = id;
submitBtnEl.textContent = "Update Transaction";
cancelEditBtnEl.style.display = "inline-block";

// Scroll to form
transactionFormEl.scrollIntoView({ behavior: 'smooth' });
}

// Cancel edit function
function cancelEdit() {
editingTransactionId = null;
submitBtnEl.textContent = "Add Transaction";
cancelEditBtnEl.style.display = "none";
transactionFormEl.reset();
dateEl.value = new Date().toISOString().split('T')[0];
}

function removeTransaction(id){
transactions = transactions.filter(transaction => transaction.id !== id);

localStorage.setItem("transactions", JSON.stringify(transactions));

updateTransactionList();
updateSummary();
updateCategoryFilter(); // Update category dropdown
}

function updateSummary(){
const balance = transactions
.reduce((acc, transaction) => acc + transaction.amount, 0);

const income = transactions
    .filter(transaction => transaction.amount > 0)
    .reduce((acc, transaction) => acc + transaction.amount, 0);

const expense = transactions
    .filter(transaction => transaction.amount < 0)
    .reduce((acc, transaction) => acc + transaction.amount, 0);

balanceEl.textContent = formatCurrency(balance);
incomeAmountEl.textContent = formatCurrency(income);
expenseAmountEl.textContent = formatCurrency(expense);
}

// Search, Filter, and Sort Handlers
function handleSearchInput(e) {
    currentFilters.search = e.target.value.trim();
    updateTransactionList();
    updateClearFiltersButton();
}

function handleCategoryFilter(e) {
    currentFilters.category = e.target.value;
    updateTransactionList();
    updateClearFiltersButton();
}

function handleDateFilter(e) {
    currentFilters.dateRange = e.target.value;
    updateTransactionList();
    updateClearFiltersButton();
}

function handleSortChange(e) {
    currentFilters.sort = e.target.value;
    updateTransactionList();
}

function clearAllFilters() {
    // Reset filters
    currentFilters.search = "";
    currentFilters.category = "all";
    currentFilters.dateRange = "all";
    currentFilters.sort = "date-desc";
    
    // Reset UI elements
    searchInputEl.value = "";
    categoryFilterEl.value = "all";
    dateFilterEl.value = "all";
    sortSelectEl.value = "date-desc";
    
    updateTransactionList();
    updateClearFiltersButton();
}

function updateResultsCount(count) {
    const total = transactions.length;
    
    if (count === total) {
        resultsCountEl.textContent = `Showing all ${total} transaction${total !== 1 ? 's' : ''}`;
    } else {
        resultsCountEl.textContent = `Showing ${count} of ${total} transaction${total !== 1 ? 's' : ''}`;
    }
}

function updateClearFiltersButton() {
    const hasActiveFilters = 
        currentFilters.search !== "" ||
        currentFilters.category !== "all" ||
        currentFilters.dateRange !== "all";
    
    clearFiltersEl.style.display = hasActiveFilters ? "inline-block" : "none";
}

// Update category filter dropdown with unique categories
function updateCategoryFilter() {
    // Get unique categories
    const categories = [...new Set(
        transactions
            .map(t => t.category)
            .filter(c => c && c.trim() !== "")
    )].sort();
    
    // Store current selection
    const currentSelection = categoryFilterEl.value;
    
    // Clear and rebuild dropdown
    categoryFilterEl.innerHTML = '<option value="all">All Categories</option>';
    
    if (categories.length > 0) {
        categories.forEach(category => {
            const option = document.createElement("option");
            option.value = category;
            option.textContent = category;
            categoryFilterEl.appendChild(option);
        });
        
        // Add "Uncategorized" option if there are transactions without categories
        const hasUncategorized = transactions.some(t => !t.category || t.category.trim() === "");
        if (hasUncategorized) {
            const option = document.createElement("option");
            option.value = "uncategorized";
            option.textContent = "Uncategorized";
            categoryFilterEl.appendChild(option);
        }
    }
    
    // Restore selection if it still exists
    if (currentSelection && [...categoryFilterEl.options].some(opt => opt.value === currentSelection)) {
        categoryFilterEl.value = currentSelection;
    }
}

updateTransactionList();
updateSummary();
updateCategoryFilter();

// Set default date to today on page load
dateEl.value = new Date().toISOString().split('T')[0];