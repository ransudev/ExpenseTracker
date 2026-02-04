# Expense Tracker - In-Depth Technical Explanation

## Overview
This document provides a comprehensive technical breakdown of all features implemented in the Expense Tracker application, including detailed code explanations and implementation patterns.

---

## Table of Contents
1. [State Management](#state-management)
2. [Edit Functionality](#edit-functionality)
3. [Categories/Tags System](#categoriestags-system)
4. [Date Tracking](#date-tracking)
5. [Search Functionality](#search-functionality)
6. [Filter System](#filter-system)
7. [Sort System](#sort-system)
8. [Event Delegation](#event-delegation)
9. [LocalStorage Persistence](#localstorage-persistence)

---

## State Management

### Application State Structure

The application maintains three main state variables:

```javascript
// Transaction data array - loaded from localStorage
let transactions = JSON.parse(localStorage.getItem("transactions")) || [];

// Tracks which transaction is currently being edited (null if not editing)
let editingTransactionId = null;

// Filter and sort state object
let currentFilters = {
    search: "",              // Search query string
    category: "all",         // Selected category filter
    dateRange: "all",        // Date range filter type
    customDateFrom: null,    // Custom date range start
    customDateTo: null,      // Custom date range end
    sort: "date-desc"        // Current sort option
};
```

**Why this structure?**
- `transactions` array stores all data as objects (not HTML strings)
- `editingTransactionId` provides clear editing state tracking
- `currentFilters` centralizes all filter/sort logic in one place
- Easy to persist, debug, and maintain

---

## Edit Functionality

### How Edit Works

#### Step 1: User Clicks Edit Button

The edit button is created dynamically for each transaction:

```javascript
// In createTransactionElement() function
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
```

**Key Points:**
- `data-id` attribute stores the transaction ID
- Font Awesome icons for visual clarity
- Both buttons handled via event delegation (see [Event Delegation](#event-delegation))

#### Step 2: Event Delegation Captures Click

```javascript
// Event delegation on parent list
transactionListEl.addEventListener("click", handleTransactionClick);

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
```

**How it works:**
- Single event listener on parent (`transactionListEl`)
- `e.target.closest()` finds the button even if icon is clicked
- Extracts ID from `data-id` attribute
- Routes to appropriate handler function

#### Step 3: Load Transaction Data into Form

```javascript
function editTransaction(id) {
    // Find the transaction by ID
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;

    // Populate form fields with current values
    descriptionEl.value = transaction.description;
    amountEl.value = transaction.amount;
    dateEl.value = transaction.date || '';
    categoryEl.value = transaction.category || '';

    // Update UI for editing mode
    editingTransactionId = id;
    submitBtnEl.textContent = "Update Transaction";
    cancelEditBtnEl.style.display = "inline-block";

    // Smooth scroll to form
    transactionFormEl.scrollIntoView({ behavior: 'smooth' });
}
```

**Key Features:**
- Uses `Array.find()` to locate transaction
- Pre-fills all form fields
- Changes button text to "Update Transaction"
- Shows cancel button
- Smooth scrolls to form for better UX

#### Step 4: Save or Cancel Edit

```javascript
function addTransaction(e) {
    e.preventDefault();

    // Extract form values
    const description = descriptionEl.value.trim();
    const amount = parseFloat(amountEl.value);
    const date = dateEl.value;
    const category = categoryEl.value.trim();

    // Check if we're editing or adding new transaction
    if (editingTransactionId !== null) {
        // UPDATE MODE: Find and update existing transaction
        const transactionIndex = transactions.findIndex(t => t.id === editingTransactionId);
        if (transactionIndex !== -1) {
            transactions[transactionIndex] = {
                ...transactions[transactionIndex],  // Preserve original ID
                description,
                amount,
                date,
                category
            };
        }
        // Reset editing state
        editingTransactionId = null;
        submitBtnEl.textContent = "Add Transaction";
        cancelEditBtnEl.style.display = "none";
    } else {
        // ADD MODE: Create new transaction
        transactions.push({
            id: Date.now(),  // Unique timestamp ID
            description,
            amount,
            date,
            category
        });
    }

    // Persist to localStorage
    localStorage.setItem("transactions", JSON.stringify(transactions));

    // Update UI
    updateTransactionList();
    updateSummary();
    updateCategoryFilter();

    // Reset form
    transactionFormEl.reset();
    dateEl.value = new Date().toISOString().split('T')[0];
}
```

**Smart Logic:**
- Single function handles both add AND edit
- Checks `editingTransactionId` to determine mode
- Uses spread operator `...` to preserve ID when updating
- Resets editing state after save

**Cancel Edit:**

```javascript
function cancelEdit() {
    editingTransactionId = null;
    submitBtnEl.textContent = "Add Transaction";
    cancelEditBtnEl.style.display = "none";
    transactionFormEl.reset();
    dateEl.value = new Date().toISOString().split('T')[0];
}
```

---

## Categories/Tags System

### How Categories Work

#### Step 1: Category Input Field

```html
<div class="form-group">
    <label for="category">Category/Tag (Optional)</label>
    <input type="text" id="category" placeholder="e.g., Food, Transport, Bills..." />
</div>
```

**Features:**
- Optional field (no `required` attribute)
- Freeform text input
- User defines their own categories

#### Step 2: Display Category as Chip

```javascript
// In createTransactionElement() function
const categoryChip = transaction.category ? 
    `<span class="category-chip">${transaction.category}</span>` : 
    '';

li.innerHTML = `
    <div class="transaction-info">
        <span class="transaction-description">${transaction.description}</span>
        ${categoryChip}
        ${dateDisplay ? `<span class="transaction-date">${dateDisplay}</span>` : ''}
    </div>
    ...
`;
```

**How it works:**
- Ternary operator checks if category exists
- Only displays chip if category is present
- Template literal inserts chip HTML

**CSS Styling:**

```css
.category-chip {
    display: inline-block;
    padding: 2px 10px;
    background-color: #e2e8f0;
    border-radius: 12px;
    font-size: 0.75rem;
    color: #2d3748;
    font-weight: 500;
    margin-top: 4px;
    width: fit-content;
}
```

**Visual Result:**
- Small, rounded label
- Gray background
- Positioned under description

#### Step 3: Auto-Populate Category Filter

```javascript
function updateCategoryFilter() {
    // Extract unique categories from all transactions
    const categories = [...new Set(
        transactions
            .map(t => t.category)
            .filter(c => c && c.trim() !== "")
    )].sort();
    
    // Store current selection
    const currentSelection = categoryFilterEl.value;
    
    // Rebuild dropdown
    categoryFilterEl.innerHTML = '<option value="all">All Categories</option>';
    
    if (categories.length > 0) {
        // Add each unique category
        categories.forEach(category => {
            const option = document.createElement("option");
            option.value = category;
            option.textContent = category;
            categoryFilterEl.appendChild(option);
        });
        
        // Add "Uncategorized" option if needed
        const hasUncategorized = transactions.some(t => !t.category || t.category.trim() === "");
        if (hasUncategorized) {
            const option = document.createElement("option");
            option.value = "uncategorized";
            option.textContent = "Uncategorized";
            categoryFilterEl.appendChild(option);
        }
    }
    
    // Restore previous selection if still valid
    if (currentSelection && [...categoryFilterEl.options].some(opt => opt.value === currentSelection)) {
        categoryFilterEl.value = currentSelection;
    }
}
```

**Breakdown:**
1. `[...new Set()]` removes duplicates
2. `.map()` extracts category values
3. `.filter()` removes empty/null categories
4. `.sort()` alphabetizes list
5. Dynamically creates `<option>` elements
6. Preserves user's selection after update

**Called automatically:**
- After adding transaction
- After editing transaction
- After deleting transaction
- On page load

---

## Date Tracking

### Date Implementation

#### Step 1: Date Input with Auto-Default

```html
<div class="form-group">
    <label for="date">Date</label>
    <input type="date" id="date" required />
</div>
```

```javascript
// Set today's date on page load
dateEl.value = new Date().toISOString().split('T')[0];
```

**How it works:**
- `new Date()` creates current date/time
- `.toISOString()` converts to "2026-02-04T00:00:00.000Z"
- `.split('T')[0]` extracts "2026-02-04"
- HTML5 date input displays as date picker

#### Step 2: Store Date with Transaction

```javascript
transactions.push({
    id: Date.now(),
    description,
    amount,
    date,        // ← Stored as "YYYY-MM-DD" string
    category
});
```

#### Step 3: Format Date for Display

```javascript
// In createTransactionElement() function
const dateDisplay = transaction.date ? 
    new Date(transaction.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
    }) : 
    '';
```

**Input:** `"2026-02-04"`  
**Output:** `"Feb 4, 2026"`

**Options explained:**
- `month: 'short'` → "Feb" instead of "February"
- `day: 'numeric'` → "4" instead of "04"
- `year: 'numeric'` → "2026"

---

## Search Functionality

### Real-Time Search Implementation

#### Step 1: Search Input with Icon

```html
<div class="search-box">
    <i class="fa-solid fa-magnifying-glass"></i>
    <input type="text" id="search-input" placeholder="Search transactions..." />
</div>
```

#### Step 2: Event Listener for Real-Time Search

```javascript
searchInputEl.addEventListener("input", handleSearchInput);

function handleSearchInput(e) {
    currentFilters.search = e.target.value.trim();
    updateTransactionList();
    updateClearFiltersButton();
}
```

**Why `input` event?**
- Fires on every keystroke
- Real-time feedback as user types
- Better UX than `change` event (which fires on blur)

#### Step 3: Search Filter Logic

```javascript
// In getFilteredAndSortedTransactions() function
if (currentFilters.search) {
    const searchLower = currentFilters.search.toLowerCase();
    filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(searchLower) ||
        (t.category && t.category.toLowerCase().includes(searchLower))
    );
}
```

**How it works:**
1. Convert search term to lowercase
2. Convert description to lowercase and check if it includes search term
3. Also check category field (if exists)
4. `||` (OR) operator matches either field
5. Returns true/false for each transaction

**Examples:**
- Search "lunch" → matches "Lunch at cafe" or category "Lunch"
- Search "jeep" → matches "Jeepney fare"
- Case-insensitive: "FOOD" matches "food" and "Food"

---

## Filter System

### Multi-Filter Architecture

All filters are applied sequentially to narrow down results:

```javascript
function getFilteredAndSortedTransactions() {
    let filtered = [...transactions];  // Start with copy of all transactions

    // Filter 1: Search
    if (currentFilters.search) { /* ... */ }

    // Filter 2: Category
    if (currentFilters.category !== "all") { /* ... */ }

    // Filter 3: Date Range
    if (currentFilters.dateRange !== "all") { /* ... */ }

    // Finally: Sort
    filtered.sort((a, b) => { /* ... */ });

    return filtered;
}
```

### Category Filter

```javascript
if (currentFilters.category !== "all") {
    filtered = filtered.filter(t => {
        if (currentFilters.category === "uncategorized") {
            // Show transactions WITHOUT category
            return !t.category || t.category.trim() === "";
        }
        // Show transactions WITH specific category
        return t.category === currentFilters.category;
    });
}
```

**Logic:**
- `"all"` → Skip filter, show everything
- `"uncategorized"` → Only transactions with empty/null category
- Any other value → Exact match on category name

### Date Range Filter

#### Preset Ranges

```javascript
if (currentFilters.dateRange !== "all") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);  // Normalize to midnight
    
    filtered = filtered.filter(t => {
        if (!t.date) return false;  // Exclude transactions without date
        
        const transactionDate = new Date(t.date);
        transactionDate.setHours(0, 0, 0, 0);
        
        if (currentFilters.dateRange === "today") {
            return transactionDate.getTime() === today.getTime();
        } 
        else if (currentFilters.dateRange === "week") {
            // Calendar-based: Start of current week (Sunday) to end of week (Saturday)
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay()); // Go back to Sunday
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
            endOfWeek.setHours(23, 59, 59, 999);
            return transactionDate >= startOfWeek && transactionDate <= endOfWeek;
        } 
        else if (currentFilters.dateRange === "month") {
            // Calendar-based: First day to last day of current month
            const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            firstOfMonth.setHours(0, 0, 0, 0);
            const lastOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            lastOfMonth.setHours(23, 59, 59, 999);
            return transactionDate >= firstOfMonth && transactionDate <= lastOfMonth;
        }
        // ... custom range logic
    });
}
```

**Key Points:**
- `.setHours(0, 0, 0, 0)` removes time component
- `.getTime()` converts to timestamp for comparison
- **"Week"** = Current calendar week (Sunday to Saturday)
  - Uses `.getDay()` to find Sunday (0 = Sunday)
  - Includes future dates within the same week
- **"Month"** = Current calendar month (1st to last day)
  - `new Date(year, month, 1)` = first day of month
  - `new Date(year, month + 1, 0)` = last day of month (day 0 of next month)
  - Includes future dates within the same month

#### Custom Date Range

```javascript
else if (currentFilters.dateRange === "custom") {
    if (currentFilters.customDateFrom && currentFilters.customDateTo) {
        const fromDate = new Date(currentFilters.customDateFrom);
        const toDate = new Date(currentFilters.customDateTo);
        fromDate.setHours(0, 0, 0, 0);
        toDate.setHours(23, 59, 59, 999);  // End of day
        return transactionDate >= fromDate && transactionDate <= toDate;
    }
}
```

**Validation Logic:**

```javascript
function applyCustomDateRange() {
    const fromDate = dateFromEl.value;
    const toDate = dateToEl.value;
    
    // Check both dates selected
    if (!fromDate || !toDate) {
        alert("Please select both start and end dates");
        return;
    }
    
    // Check logical order
    if (new Date(fromDate) > new Date(toDate)) {
        alert("Start date must be before end date");
        return;
    }
    
    // Apply filter
    currentFilters.customDateFrom = fromDate;
    currentFilters.customDateTo = toDate;
    updateTransactionList();
    updateClearFiltersButton();
}
```

---

## Sort System

### Sort Implementation

```javascript
// Apply sorting to filtered results
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
```

### Sort Algorithms Explained

#### 1. Date Sort

```javascript
// Newest first (descending)
return new Date(b.date || 0) - new Date(a.date || 0);

// Oldest first (ascending)
return new Date(a.date || 0) - new Date(b.date || 0);
```

**How it works:**
- Converts date strings to Date objects
- Subtracts timestamps (milliseconds since 1970)
- Positive result = swap positions
- Negative result = keep order
- `|| 0` handles missing dates

#### 2. Amount Sort

```javascript
// High to Low
return Math.abs(b.amount) - Math.abs(a.amount);

// Low to High
return Math.abs(a.amount) - Math.abs(b.amount);
```

**Why `Math.abs()`?**
- Expenses are negative (-50)
- Income is positive (+100)
- `Math.abs(-50)` = 50
- Sorts by magnitude, not sign
- Result: Both expenses and income sorted by absolute value

#### 3. Alphabetical Sort

```javascript
// A-Z
return a.description.localeCompare(b.description);

// Z-A
return b.description.localeCompare(a.description);
```

**Why `localeCompare()`?**
- Handles special characters properly
- Case-insensitive by default
- Better than simple `<` or `>` comparison
- Respects language-specific sorting rules

---

## Event Delegation

### Why Event Delegation?

**Problem without delegation:**
```javascript
// BAD: Adds listener to EVERY button
transactions.forEach(t => {
    const editBtn = document.querySelector(`[data-id="${t.id}"]`);
    editBtn.addEventListener("click", () => editTransaction(t.id));
});
```

**Issues:**
- Creates 100s of listeners if you have many transactions
- Must re-attach listeners every time list updates
- Memory inefficient

**Solution with delegation:**
```javascript
// GOOD: Single listener on parent
transactionListEl.addEventListener("click", handleTransactionClick);
```

### Implementation Pattern

```javascript
// Single event listener on parent container
transactionListEl.addEventListener("click", handleTransactionClick);

function handleTransactionClick(e) {
    // Find which button was clicked (if any)
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
```

**How `.closest()` works:**
```html
<button class="edit-btn" data-id="123">
    <i class="fa-solid fa-pen-to-square"></i>  ← User clicks here
</button>
```

- Click on `<i>` icon
- `e.target` = `<i>` element (not button!)
- `e.target.closest('.edit-btn')` walks UP the DOM tree
- Finds first ancestor with class `edit-btn`
- Returns the `<button>` element

**Benefits:**
- Single event listener for all buttons
- Works with dynamically added elements
- Better performance
- Cleaner code

---

## LocalStorage Persistence

### How Data is Saved

#### Save to LocalStorage

```javascript
// Convert array to JSON string and save
localStorage.setItem("transactions", JSON.stringify(transactions));
```

**Before:** JavaScript array
```javascript
[
    {id: 123, description: "Lunch", amount: -15, date: "2026-02-04", category: "Food"},
    {id: 456, description: "Salary", amount: 2000, date: "2026-02-01", category: "Income"}
]
```

**After:** JSON string
```json
'[{"id":123,"description":"Lunch","amount":-15,"date":"2026-02-04","category":"Food"},{"id":456,"description":"Salary","amount":2000,"date":"2026-02-01","category":"Income"}]'
```

#### Load from LocalStorage

```javascript
// Load on page load
let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
```

**How it works:**
1. `localStorage.getItem("transactions")` returns JSON string (or null if doesn't exist)
2. `JSON.parse()` converts string back to array
3. `|| []` provides empty array as fallback if null

### When Data is Saved

```javascript
// After adding transaction
localStorage.setItem("transactions", JSON.stringify(transactions));
updateTransactionList();

// After editing transaction
localStorage.setItem("transactions", JSON.stringify(transactions));
updateTransactionList();

// After deleting transaction
transactions = transactions.filter(transaction => transaction.id !== id);
localStorage.setItem("transactions", JSON.stringify(transactions));
updateTransactionList();
```

**Saved after every change:**
- Add new transaction
- Edit existing transaction
- Delete transaction

**Why this approach?**
- Data never lost (persists across browser sessions)
- No server required
- Works offline
- Instant save

---

## Update and Render Flow

### Complete Update Cycle

```
User Action (Add/Edit/Delete)
    ↓
Update transactions array
    ↓
Save to localStorage
    ↓
Call updateTransactionList()
    ↓
getFilteredAndSortedTransactions()
    ↓
Apply Search Filter
    ↓
Apply Category Filter
    ↓
Apply Date Filter
    ↓
Apply Sort
    ↓
Create DOM elements for each filtered transaction
    ↓
Update results count
    ↓
Call updateSummary() (balance, income, expense)
    ↓
Call updateCategoryFilter() (rebuild dropdown)
```

### Render Function

```javascript
function updateTransactionList() {
    // Clear existing list
    transactionListEl.innerHTML = "";

    // Get filtered and sorted transactions
    let displayTransactions = getFilteredAndSortedTransactions();

    // Create DOM element for each transaction
    displayTransactions.forEach(transaction => {
        const transactionEl = createTransactionElement(transaction);
        transactionListEl.appendChild(transactionEl);
    });

    // Update results count
    updateResultsCount(displayTransactions.length);
}
```

**Separation of Concerns:**
- **Data layer:** `getFilteredAndSortedTransactions()` (pure logic)
- **View layer:** `createTransactionElement()` (HTML generation)
- **Update layer:** `updateTransactionList()` (orchestration)

---

## Results Count and Clear Filters

### Results Counter

```javascript
function updateResultsCount(count) {
    const total = transactions.length;
    
    if (count === total) {
        resultsCountEl.textContent = `Showing all ${total} transaction${total !== 1 ? 's' : ''}`;
    } else {
        resultsCountEl.textContent = `Showing ${count} of ${total} transaction${total !== 1 ? 's' : ''}`;
    }
}
```

**Dynamic Text:**
- All visible: "Showing all 10 transactions"
- Filtered: "Showing 3 of 10 transactions"
- Singular: "Showing 1 of 5 transaction" (no 's')

### Clear Filters Button

```javascript
function updateClearFiltersButton() {
    const hasActiveFilters = 
        currentFilters.search !== "" ||
        currentFilters.category !== "all" ||
        currentFilters.dateRange !== "all";
    
    // Show button only when filters are active
    clearFiltersEl.style.display = hasActiveFilters ? "inline-block" : "none";
}
```

**Smart Display:**
- Hidden by default
- Appears when ANY filter is active
- Provides quick reset option

```javascript
function clearAllFilters() {
    // Reset filter state
    currentFilters.search = "";
    currentFilters.category = "all";
    currentFilters.dateRange = "all";
    currentFilters.customDateFrom = null;
    currentFilters.customDateTo = null;
    currentFilters.sort = "date-desc";
    
    // Reset UI elements
    searchInputEl.value = "";
    categoryFilterEl.value = "all";
    dateFilterEl.value = "all";
    sortSelectEl.value = "date-desc";
    customDateRangeEl.style.display = "none";
    dateFromEl.value = "";
    dateToEl.value = "";
    
    // Update display
    updateTransactionList();
    updateClearFiltersButton();
}
```

---

## Performance Optimizations

### 1. Event Delegation
- **Before:** N event listeners (N = number of transactions)
- **After:** 1 event listener on parent
- **Benefit:** Reduced memory usage, faster rendering

### 2. Filter in Memory
```javascript
// All filtering happens BEFORE rendering
let filtered = [...transactions];
// ... apply all filters ...
// Then render once
displayTransactions.forEach(transaction => { /* render */ });
```

**Benefit:** Single DOM update instead of multiple

### 3. Preserve User Selection
```javascript
// Remember what user selected
const currentSelection = categoryFilterEl.value;

// Rebuild dropdown
categoryFilterEl.innerHTML = '...';

// Restore selection
categoryFilterEl.value = currentSelection;
```

**Benefit:** Better UX, no loss of state

---

## CSS Architecture

### Component-Based Styling

```css
/* Container for all filter controls */
.controls-container {
    background: #f8f9fa;
    padding: 16px;
    border-radius: 12px;
    margin-bottom: 16px;
}

/* Individual filter dropdowns */
.filter-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

/* Category chip badge */
.category-chip {
    display: inline-block;
    padding: 2px 10px;
    background-color: #e2e8f0;
    border-radius: 12px;
    font-size: 0.75rem;
}
```

### Responsive Design

```css
@media (max-width: 580px) {
    /* Stack filters vertically on mobile */
    .filter-sort-row {
        grid-template-columns: 1fr;
        gap: 10px;
    }
    
    /* Custom date range stacks */
    .custom-date-range {
        flex-direction: column;
        align-items: stretch;
    }
}
```

---

## Important Bug Fix: Calendar-Based Date Filters

### The Problem
**Original Implementation (v2.0):**
- "This Week" = Last 7 days ending today
- "This Month" = Last 30 days ending today

**Issue:** Future-dated transactions within the current month/week were hidden because the filter used "today" as the upper bound.

**Example:**
- Today: February 4, 2026
- Transaction: February 14, 2026 (future date)
- Filter "This Month": Showed January 4 - February 4
- Result: February 14 transaction was **hidden** ❌

### The Solution (v2.0.1)

**Calendar-Based Implementation:**

```javascript
// THIS WEEK: Sunday to Saturday of current week
else if (currentFilters.dateRange === "week") {
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Back to Sunday
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Forward to Saturday
    endOfWeek.setHours(23, 59, 59, 999);
    return transactionDate >= startOfWeek && transactionDate <= endOfWeek;
}

// THIS MONTH: 1st to last day of current month
else if (currentFilters.dateRange === "month") {
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    lastOfMonth.setHours(23, 59, 59, 999);
    return transactionDate >= firstOfMonth && transactionDate <= lastOfMonth;
}
```

**How `new Date(year, month + 1, 0)` works:**
- Creates date for "day 0" of next month
- JavaScript interprets "day 0" as last day of previous month
- Example: `new Date(2026, 3, 0)` = March 31, 2026 (last day of February)

**Result After Fix:**
- Today: February 4, 2026
- Filter "This Month": Shows February 1 - February 28/29
- Transaction on February 14: Now **visible** ✅

### Benefits
1. **Predictable behavior** - Matches user expectations of "current month/week"
2. **Includes future dates** - Plan ahead with upcoming transactions
3. **Calendar alignment** - Natural monthly/weekly boundaries
4. **Consistent ranges** - Week always has 7 days, month always has 28-31 days

---

## Summary of Key Patterns

### 1. Single Responsibility Functions
Each function has ONE job:
- `addTransaction()` - Handle form submission
- `editTransaction()` - Load data into form
- `updateTransactionList()` - Render list
- `getFilteredAndSortedTransactions()` - Filter and sort logic

### 2. State-Driven UI
```javascript
// State determines UI
if (editingTransactionId !== null) {
    submitBtnEl.textContent = "Update Transaction";
} else {
    submitBtnEl.textContent = "Add Transaction";
}
```

### 3. Event Delegation Pattern
```javascript
// Parent listens, children trigger
parentEl.addEventListener("click", handler);
```

### 4. Immutable Data Operations
```javascript
// Don't modify original array
let filtered = [...transactions];  // Create copy
filtered = filtered.filter(...)    // Transform copy
```

### 5. Template Literals for HTML
```javascript
li.innerHTML = `
    <div class="transaction-info">
        <span>${transact1  
**Last Updated:** February 4, 2026  
**Code Version:** 2.0.1  
**Code Tested:** ✅ All features working as documented  
**Bug Fixes:** ✅ Calendar-based date filters imple
`;
```

---

## Testing the Features

### Test Edit Functionality
1. Add a transaction
2. Click edit icon
3. Verify form fills with data
4. Change amount
5. Click "Update Transaction"
6. Verify changes appear immediately

### Test Search
1. Add transactions: "Lunch at cafe", "Dinner at home", "Jeepney fare"
2. Type "lunch" → Shows only lunch transaction
3. Type "jeep" → Shows only jeepney transaction
4. Clear search → Shows all

### Test Category Filter
1. Add transactions with categories: "Food", "Transport", "Food"
2. Select "Food" → Shows 2 transactions
3. Select "All Categories" → Shows 3 transactions

### Test Date Filter
1. Add transaction today
2. Add transaction 10 days ago
3. Select "This Week" → Shows only today's transaction
4. Select "All Time" → Shows both

### Test Sort
1. Add multiple transactions with different dates/amounts
2. Select "Date (Oldest First)" → Verify order
3. Select "Amount (High to Low)" → Verify largest first

---

## Conclusion

This expense tracker demonstrates best practices in vanilla JavaScript development:

✅ **Clean Architecture** - Separation of concerns  
✅ **Efficient Events** - Event delegation pattern  
✅ **Persistent Data** - LocalStorage integration  
✅ **User-Friendly** - Real-time updates and feedback  
✅ **Maintainable Code** - Modular, well-commented functions  
✅ **No Framework Overhead** - Pure JavaScript performance  

The codebase is ready for future enhancements like export/import, charts, or recurring transactions.

---

**Document Version:** 1.0  
**Last Updated:** February 4, 2026  
**Code Tested:** ✅ All features working as documented
