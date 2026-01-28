// ===================================
// App State & Initialization
// ===================================
class BudgetApp {
    constructor() {
        this.expenses = this.loadExpenses();
        this.editingId = null;
        this.initializeEventListeners();
        this.render();
    }

    // ===================================
    // Local Storage Methods
    // ===================================
    loadExpenses() {
        const stored = localStorage.getItem('earthBudgetExpenses');
        return stored ? JSON.parse(stored) : [];
    }

    saveExpenses() {
        localStorage.setItem('earthBudgetExpenses', JSON.stringify(this.expenses));
    }

    // ===================================
    // Event Listeners
    // ===================================
    initializeEventListeners() {
        // Add expense form
        const form = document.getElementById('expenseForm');
        form.addEventListener('submit', (e) => this.handleAddExpense(e));

        // Edit expense form
        const editForm = document.getElementById('editExpenseForm');
        editForm.addEventListener('submit', (e) => this.handleEditExpense(e));

        // Modal controls
        const closeModal = document.getElementById('closeModal');
        const cancelEdit = document.getElementById('cancelEdit');
        const modal = document.getElementById('editModal');

        closeModal.addEventListener('click', () => this.closeModal());
        cancelEdit.addEventListener('click', () => this.closeModal());
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });

        // Clear all button
        const clearAllBtn = document.getElementById('clearAllBtn');
        clearAllBtn.addEventListener('click', () => this.handleClearAll());
    }

    // ===================================
    // Expense Management
    // ===================================
    handleAddExpense(e) {
        e.preventDefault();

        const name = document.getElementById('expenseName').value.trim();
        const amount = parseFloat(document.getElementById('expenseAmount').value);
        const category = document.getElementById('expenseCategory').value;

        if (!name || !amount || !category) {
            return;
        }

        const expense = {
            id: Date.now(),
            name,
            amount,
            category,
            date: new Date().toISOString()
        };

        this.expenses.push(expense);
        this.saveExpenses();
        this.render();

        // Reset form
        e.target.reset();

        // Add success feedback
        this.showSuccessFeedback();
    }

    handleEditExpense(e) {
        e.preventDefault();

        const name = document.getElementById('editExpenseName').value.trim();
        const amount = parseFloat(document.getElementById('editExpenseAmount').value);
        const category = document.getElementById('editExpenseCategory').value;

        if (!name || !amount || !category || !this.editingId) {
            return;
        }

        const index = this.expenses.findIndex(exp => exp.id === this.editingId);
        if (index !== -1) {
            this.expenses[index] = {
                ...this.expenses[index],
                name,
                amount,
                category
            };
            this.saveExpenses();
            this.render();
            this.closeModal();
        }
    }

    deleteExpense(id) {
        if (confirm('Are you sure you want to delete this expense?')) {
            this.expenses = this.expenses.filter(exp => exp.id !== id);
            this.saveExpenses();
            this.render();
        }
    }

    handleClearAll() {
        if (this.expenses.length === 0) {
            return;
        }

        if (confirm('Are you sure you want to delete all expenses? This action cannot be undone.')) {
            this.expenses = [];
            this.saveExpenses();
            this.render();
        }
    }

    // ===================================
    // Modal Management
    // ===================================
    openEditModal(id) {
        const expense = this.expenses.find(exp => exp.id === id);
        if (!expense) return;

        this.editingId = id;

        document.getElementById('editExpenseName').value = expense.name;
        document.getElementById('editExpenseAmount').value = expense.amount;
        document.getElementById('editExpenseCategory').value = expense.category;

        const modal = document.getElementById('editModal');
        modal.classList.add('active');
    }

    closeModal() {
        const modal = document.getElementById('editModal');
        modal.classList.remove('active');
        this.editingId = null;
    }

    // ===================================
    // Calculations
    // ===================================
    calculateTotal() {
        return this.expenses.reduce((sum, exp) => sum + exp.amount, 0);
    }

    calculateCategoryTotals() {
        const totals = {};
        this.expenses.forEach(exp => {
            if (!totals[exp.category]) {
                totals[exp.category] = 0;
            }
            totals[exp.category] += exp.amount;
        });
        return totals;
    }

    getCurrentMonthExpenses() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        return this.expenses.filter(exp => {
            const expDate = new Date(exp.date);
            return expDate.getMonth() === currentMonth && 
                   expDate.getFullYear() === currentYear;
        });
    }

    // ===================================
    // Rendering Methods
    // ===================================
    render() {
        this.renderTotal();
        this.renderCategoryBreakdown();
        this.renderExpensesList();
    }

    renderTotal() {
        const monthExpenses = this.getCurrentMonthExpenses();
        const total = monthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        const totalElement = document.getElementById('totalSpent');
        totalElement.textContent = `₹${total.toFixed(2)}`;
    }

    renderCategoryBreakdown() {
        const monthExpenses = this.getCurrentMonthExpenses();
        const categoryTotals = {};
        
        monthExpenses.forEach(exp => {
            if (!categoryTotals[exp.category]) {
                categoryTotals[exp.category] = 0;
            }
            categoryTotals[exp.category] += exp.amount;
        });

        const breakdownElement = document.getElementById('categoryBreakdown');
        
        if (Object.keys(categoryTotals).length === 0) {
            breakdownElement.innerHTML = '<p class="empty-state">No expenses yet</p>';
            return;
        }

        const categoryNames = {
            food: '🍎 Food & Dining',
            health: '💊 Health & Wellness',
            transport: '🚗 Transportation',
            entertainment: '🎬 Entertainment',
            utilities: '💡 Utilities',
            shopping: '🛍️ Shopping',
            education: '📚 Education',
            other: '🌍 Other'
        };

        const html = Object.entries(categoryTotals)
            .sort((a, b) => b[1] - a[1])
            .map(([category, amount]) => `
                <div class="category-item">
                    <span class="category-name">${categoryNames[category] || category}</span>
                    <span class="category-amount">₹${amount.toFixed(2)}</span>
                </div>
            `).join('');

        breakdownElement.innerHTML = html;
    }

    renderExpensesList() {
        const listElement = document.getElementById('expensesList');
        
        if (this.expenses.length === 0) {
            listElement.innerHTML = `
                <div class="empty-state-large">
                    <div class="empty-icon">🌱</div>
                    <p>No expenses tracked yet</p>
                    <p class="empty-subtitle">Start by adding your first expense above</p>
                </div>
            `;
            return;
        }

        const categoryNames = {
            food: '🍎 Food & Dining',
            health: '💊 Health & Wellness',
            transport: '🚗 Transportation',
            entertainment: '🎬 Entertainment',
            utilities: '💡 Utilities',
            shopping: '🛍️ Shopping',
            education: '📚 Education',
            other: '🌍 Other'
        };

        // Sort by date (newest first)
        const sortedExpenses = [...this.expenses].sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        );

        const html = sortedExpenses.map(expense => {
            const date = new Date(expense.date);
            const formattedDate = date.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });

            return `
                <div class="expense-item">
                    <div class="expense-info">
                        <div class="expense-name">${this.escapeHtml(expense.name)}</div>
                        <div class="expense-meta">
                            <span class="expense-category">${categoryNames[expense.category]}</span>
                            <span class="expense-date">${formattedDate}</span>
                        </div>
                    </div>
                    <div class="expense-amount">₹${expense.amount.toFixed(2)}</div>
                    <div class="expense-actions">
                        <button class="btn btn-edit" onclick="app.openEditModal(${expense.id})">
                            Edit
                        </button>
                        <button class="btn btn-danger" onclick="app.deleteExpense(${expense.id})">
                            Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        listElement.innerHTML = html;
    }

    // ===================================
    // Utility Methods
    // ===================================
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showSuccessFeedback() {
        const submitBtn = document.getElementById('submitBtn');
        const originalText = submitBtn.innerHTML;
        
        submitBtn.innerHTML = '<span class="btn-text">Added!</span> <span class="btn-icon">✓</span>';
        submitBtn.style.background = 'linear-gradient(135deg, #5a8f5a 0%, #6b8e6b 100%)';
        
        setTimeout(() => {
            submitBtn.innerHTML = originalText;
            submitBtn.style.background = '';
        }, 1500);
    }
}

// ===================================
// Initialize App
// ===================================
let app;

document.addEventListener('DOMContentLoaded', () => {
    app = new BudgetApp();
});