import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  ArrowRight,
  Eye
} from 'lucide-react';
import axios from 'axios';

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [summaryRes, expensesRes] = await Promise.all([
        axios.get('/api/expenses/summary'),
        axios.get('/api/expenses?limit=5')
      ]);
      
      setSummary(summaryRes.data);
      setRecentExpenses(expensesRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
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
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back! Here's your expense overview for {getMonthName(new Date().getMonth())}
          </p>
        </div>
        <Link
          to="/add-expense"
          className="btn-primary flex items-center space-x-2 mt-4 sm:mt-0"
        >
          <Plus className="w-5 h-5" />
          <span>Add Expense</span>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">
                {summary ? formatCurrency(summary.currentMonth.total) : '₹0'}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Expenses Count</p>
              <p className="text-2xl font-bold text-gray-900">
                {summary ? summary.currentMonth.count : 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">vs Last Month</p>
              <p className="text-2xl font-bold text-gray-900">
                {summary ? formatCurrency(summary.change) : '₹0'}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              {summary && summary.change >= 0 ? (
                <TrendingUp className="w-6 h-6 text-orange-600" />
              ) : (
                <TrendingDown className="w-6 h-6 text-green-600" />
              )}
            </div>
          </div>
          {summary && (
            <p className={`text-sm mt-2 ${
              summary.percentChange >= 0 ? 'text-orange-600' : 'text-green-600'
            }`}>
              {summary.percentChange >= 0 ? '+' : ''}{summary.percentChange.toFixed(1)}%
            </p>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Last Month</p>
              <p className="text-2xl font-bold text-gray-900">
                {summary ? formatCurrency(summary.previousMonth.total) : '₹0'}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Top Categories Chart */}
      {summary && summary.currentMonth.topCategories.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Spending Categories</h3>
          <div className="space-y-3">
            {summary.currentMonth.topCategories.map((category, index) => (
              <div key={category.category} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${
                    index === 0 ? 'bg-red-500' :
                    index === 1 ? 'bg-orange-500' :
                    index === 2 ? 'bg-yellow-500' :
                    index === 3 ? 'bg-green-500' : 'bg-blue-500'
                  }`}></div>
                  <span className="font-medium text-gray-700">{category.category}</span>
                </div>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(category.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Expenses */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Expenses</h3>
          <Link
            to="/expenses"
            className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        
        {recentExpenses.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Eye className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 mb-2">No expenses yet</p>
            <p className="text-sm text-gray-400">Start tracking your family expenses</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentExpenses.map((expense) => (
              <div key={expense.id} className="expense-item">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="font-medium text-gray-900">
                        {formatCurrency(expense.amount)}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                        {expense.category}
                      </span>
                    </div>
                    {expense.notes && (
                      <p className="text-gray-600 text-sm mt-1">{expense.notes}</p>
                    )}
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <p>{format(new Date(expense.date), 'MMM dd, yyyy')}</p>
                    <p className="text-xs">by {expense.addedByName}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Add New Expense</h3>
          <p className="text-blue-700 mb-4">Quickly record a new family expense</p>
          <Link to="/add-expense" className="btn-primary bg-blue-600 hover:bg-blue-700">
            Add Expense
          </Link>
        </div>

        <div className="card bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <h3 className="text-lg font-semibold text-green-900 mb-2">View Reports</h3>
          <p className="text-green-700 mb-4">Analyze your spending patterns</p>
          <Link to="/reports" className="btn-primary bg-green-600 hover:bg-green-700">
            View Reports
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
