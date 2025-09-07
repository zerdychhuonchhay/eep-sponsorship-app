import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LabelList } from 'recharts';
import { StudentStatus, Transaction, TransactionType } from '../types';
import { SkeletonDashboard } from '../components/SkeletonLoader';
import { ErrorIcon } from '../components/Icons';

interface StatCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    iconBgClass: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, iconBgClass }) => (
    <div className="rounded-lg border border-stroke bg-white dark:bg-box-dark py-6 px-7 shadow-sm">
        <div className={`flex h-11.5 w-11.5 items-center justify-center rounded-full ${iconBgClass} mb-4`}>
            {icon}
        </div>
        <div className="flex items-end justify-between">
            <div>
                <h4 className="text-2xl font-bold text-black dark:text-white">{value}</h4>
                <span className="text-sm font-medium text-body-color dark:text-gray-300">{title}</span>
            </div>
        </div>
    </div>
);

const RecentTransactions: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    useEffect(() => {
        api.getRecentTransactions().then(setTransactions).catch(console.error);
    }, []);

    return (
        <div className="rounded-lg border border-stroke bg-white dark:bg-box-dark p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-black dark:text-white mb-4">Recent Transactions</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-2 dark:bg-box-dark-2">
                            <th className="p-4 font-medium text-black dark:text-white">Description</th>
                            <th className="p-4 font-medium text-black dark:text-white">Date</th>
                            <th className="p-4 font-medium text-black dark:text-white">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="text-center p-4 text-body-color dark:text-gray-400">
                                    No recent transactions found.
                                </td>
                            </tr>
                        ) : (
                            transactions.map((t, index) => (
                                <tr key={t.id} className={index === transactions.length - 1 ? '' : 'border-b border-stroke dark:border-strokedark'}>
                                    <td className="p-4 text-black dark:text-white">{t.description}</td>
                                    <td className="p-4 text-body-color dark:text-gray-300">{new Date(t.date).toLocaleDateString()}</td>
                                    <td className={`p-4 font-medium ${t.type === TransactionType.INCOME ? 'text-success' : 'text-danger'}`}>
                                        {t.type === TransactionType.INCOME ? '+' : '-'}${t.amount.toFixed(2)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


const DashboardPage: React.FC = () => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [chartView, setChartView] = useState<'total' | 'monthly'>('total');
    const isDarkMode = document.documentElement.classList.contains('dark');

    const fetchStats = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.getDashboardStats();
            setStats(data);
        } catch (err: any) {
            console.error("Failed to fetch dashboard stats", err);
            let errorMessage = "An unexpected error occurred.";
            if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
                 errorMessage = "Could not connect to the backend server. Please check the following:\n1. Is the backend server running?\n2. Is the backend's CORS configuration correct for this domain?";
            } else {
                errorMessage = err.message || 'Please ensure the backend server is running and accessible.';
            }
            setError(`Failed to fetch dashboard stats. ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    if (loading) {
        return <SkeletonDashboard />;
    }

    if (error) {
        return (
            <div className="rounded-lg border border-stroke bg-white dark:bg-box-dark p-6 shadow-sm text-center">
                <div className="mx-auto my-4 w-16 h-16 flex items-center justify-center rounded-full bg-danger/10 text-danger">
                     <ErrorIcon />
                </div>
                <h3 className="text-xl font-semibold text-danger mb-4">An Error Occurred</h3>
                <p className="text-body-color dark:text-gray-300 whitespace-pre-line">{error}</p>
                <button onClick={fetchStats} className="mt-4 px-6 py-2 rounded-lg bg-primary text-white hover:opacity-90">
                    Retry
                </button>
            </div>
        );
    }
    
    if (!stats) {
        return (
             <div className="rounded-lg border border-stroke bg-white dark:bg-box-dark p-6 shadow-sm text-center">
                <h3 className="text-xl font-semibold text-black dark:text-white mb-4">No Data Available</h3>
                <p className="text-body-color dark:text-gray-300">Could not load dashboard data at this time.</p>
            </div>
        );
    }

    const incomeExpenseData = [
        { name: 'Financials', income: stats.income_vs_expense.income, expense: stats.income_vs_expense.expense }
    ];

    const statusColors: Record<StudentStatus, string> = {
        [StudentStatus.ACTIVE]: '#10B981',
        [StudentStatus.INACTIVE]: '#DC3545',
        [StudentStatus.PENDING_QUALIFICATION]: '#F2994A',
    };
    
    const studentStatusData = Object.entries(stats.student_status_distribution).map(([name, value]) => ({ name, value }));

    const renderCustomizedLabel = (props: any) => {
      const { x, y, width, value } = props;
      if (value === 0) return null;
      return (
        <text x={x + width / 2} y={y} fill={isDarkMode ? '#D1D5DB' : '#64748B'} textAnchor="middle" dy={-6} fontSize={12}>
          {`$${value.toLocaleString()}`}
        </text>
      );
    };

    const chartData = chartView === 'total' ? incomeExpenseData : (stats.monthly_breakdown || []);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
                <StatCard title="Total Students" value={stats.total_students} iconBgClass="bg-primary/10" icon={<svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.122-1.28-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.122-1.28.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>} />
                <StatCard title="Active Students" value={stats.active_students} iconBgClass="bg-success/10" icon={<svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24" ><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>} />
                <StatCard title="Net Balance" value={`$${stats.net_balance.toLocaleString()}`} iconBgClass="bg-secondary/10" icon={<svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01M12 16v-1m0 1v.01M4 4h16v16H4V4z"></path></svg>} />
                <StatCard title="Upcoming Filings" value={stats.upcoming_filings} iconBgClass="bg-warning/10" icon={<svg className="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>} />
            </div>

            <div className="grid grid-cols-12 gap-4 md:gap-6 2xl:gap-7.5">
                <div className="col-span-12 xl:col-span-8 bg-white dark:bg-box-dark p-6 rounded-lg border border-stroke shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-black dark:text-white mb-2 sm:mb-0">Income vs. Expense</h3>
                        <div className="flex gap-2 rounded-lg bg-gray-2 dark:bg-box-dark-2 p-1">
                            <button onClick={() => setChartView('total')} className={`px-3 py-1 text-sm rounded-md transition-colors ${chartView === 'total' ? 'bg-white dark:bg-box-dark text-primary shadow-sm font-medium' : 'text-body-color hover:bg-white/50'}`}>Total</button>
                            <button onClick={() => setChartView('monthly')} className={`px-3 py-1 text-sm rounded-md transition-colors ${chartView === 'monthly' ? 'bg-white dark:bg-box-dark text-primary shadow-sm font-medium' : 'text-body-color hover:bg-white/50'}`}>Monthly</button>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={chartData} margin={{ top: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.2)" />
                            <XAxis dataKey={chartView === 'total' ? "name" : "month"} tick={{ fill: isDarkMode ? '#9CA3AF' : '#6B7280' }} />
                            <YAxis tick={{ fill: isDarkMode ? '#9CA3AF' : '#6B7280' }} />
                            <Tooltip contentStyle={{ backgroundColor: '#1C2434', border: 'none', color: '#fff', borderRadius: '0.5rem' }} cursor={{fill: 'rgba(128,128,128,0.1)'}}/>
                            <Legend />
                            <Bar dataKey="income" fill="#10B981" name="Income" radius={[4, 4, 0, 0]}>
                                <LabelList dataKey="income" content={renderCustomizedLabel} />
                            </Bar>
                            <Bar dataKey="expense" fill="#DC3545" name="Expense" radius={[4, 4, 0, 0]}>
                                <LabelList dataKey="expense" content={renderCustomizedLabel} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="col-span-12 xl:col-span-4 bg-white dark:bg-box-dark p-6 rounded-lg border border-stroke shadow-sm">
                    <h3 className="text-xl font-semibold mb-4 text-black dark:text-white">Student Status</h3>
                     <ResponsiveContainer width="100%" height={350}>
                        <PieChart>
                            <Pie
                                data={studentStatusData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                                label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                            >
                                {studentStatusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={statusColors[entry.name as StudentStatus]} />
                                ))}
                            </Pie>
                            <Legend />
                            <Tooltip contentStyle={{ backgroundColor: '#1C2434', border: 'none', color: '#fff', borderRadius: '0.5rem' }}/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="col-span-12">
                   <RecentTransactions />
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;