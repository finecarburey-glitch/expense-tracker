import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  Filter, 
  Search, 
  Edit, 
  Trash2, 
  Calendar,
  DollarSign,
  Tag,
  User
} from 'lucide-react';
import axios from 'axios';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingExpense, setEditingExpense] = useState(null);
  
  const [filters, setFilters] = useState({
    category: '',
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
    search: ''
  });

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      const [expensesRes, categoriesRes] = await Promise.all([
        axios.get('/api/expenses', { params: filters }),
        axios.get('/api/expenses/categories')
      ]);
      
      setExpenses(expensesRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
  };

  const handleUpdate = async (expenseId, updates) => {
    try {
      await axios.put(`/api/expenses/${expenseId}`, updates);
      setEditingExpense(null);
      fetchData();
    } catch (error) {
      console.error('Error updating expense:', error);
      alert('Failed to update expense. Please try again.');
    }
  };

  const handleDelete = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    try {
      await axios.delete(`/api/expenses/${expenseId}`);
      fetchData();
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Failed to delete expense. Please try again.');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getMonthName = (month) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month];
  };

  const filteredExpenses = expenses.filter(expense => {
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      return (
        expense.notes?.toLowerCase().includes(searchTerm) ||
        expense.category.toLowerCase().includes(searchTerm) ||
        expense.addedByName.toLowerCase().includes(searchTerm)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="loading-spinner w-12 h-12"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">All Expenses</h1>
          <p className="text-gray-600 mt-1">
            View and manage all family expenses
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="btn-secondary flex items-center space-x-2 mt-4 sm:mt-0"
        >
          <Filter className="w-5 h-5" />
          <span>Filters</span>
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="input-field"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.name} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Month
              </label>
              <select
                value={filters.month}
                onChange={(e) => handleFilterChange('month', parseInt(e.target.value))}
                className="input-field"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i}>
                    {getMonthName(i)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year
              </label>
              <select
                value={filters.year}
                onChange={(e) => handleFilterChange('year', parseInt(e.target.value))}
                className="input-field"
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - 2 + i;
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Search expenses..."
                  className="input-field pl-10"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expenses List */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Expenses ({filteredExpenses.length})
          </h3>
          <p className="text-sm text-gray-500">
            {getMonthName(filters.month)} {filters.year}
          </p>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 mb-2">No expenses found</p>
            <p className="text-sm text-gray-400">Try adjusting your filters or add a new expense</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredExpenses.map((expense) => (
              <div key={expense.id} className="expense-item">
                {editingExpense?.id === expense.id ? (
                  <ExpenseEditForm
                    expense={expense}
                    categories={categories}
                    onSave={handleUpdate}
                    onCancel={() => setEditingExpense(null)}
                  />
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-xl font-bold text-gray-900">
                          {formatCurrency(expense.amount)}
                        </span>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full font-medium">
                          {expense.category}
                        </span>
                      </div>
                      
                      {expense.notes && (
                        <p className="text-gray-600 mb-2">{expense.notes}</p>
                      )}
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{format(new Date(expense.date), 'MMM dd, yyyy')}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <User className="w-4 h-4" />
                          <span>{expense.addedByName}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(expense)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Expense Edit Form Component
const ExpenseEditForm = ({ expense, categories, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    amount: expense.amount,
    category: expense.category,
    notes: expense.notes || ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(expense.id, formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleInputChange}
            className="input-field"
            min="0"
            step="0.01"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            className="input-field"
            required
          >
            {categories.map((category) => (
              <option key={category.name} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <input
            type="text"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            className="input-field"
          />
        </div>
      </div>
      
      <div className="flex space-x-2">
        <button
          type="submit"
          className="btn-primary px-4 py-2"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary px-4 py-2"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default Expenses;
