import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api.ts';
import { Transaction, TransactionType } from '../types.ts';
import { StudentsIcon, FilingsIcon, TransactionsIcon, TrendUpIcon, TrendDownIcon, IncomeIcon, ExpenseIcon } from '../components/Icons.tsx';
import { SkeletonCard } from '../components/SkeletonLoader.tsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import PageHeader from '@/components/layout/PageHeader.tsx';

interface DashboardStats {
    stats: {
        totalStudents: number;
        activeStudents: number;
        netBalance: number;
        upcomingFilings: number;
    };
    trends: {
        totalStudents: number;
        activeStudents: number;
        netBalance: number;
    };
    studentStatusDistribution: Record<string, number>;
    monthlyBreakdown: { month: string; income: number; expense: number }[];
}

type DateRangeOption = '30d' | '90d' | '365d' | 'ytd';

const dateRanges: Record<DateRangeOption, { label: string, getRange: () => { start: string, end: string } }> = {
    '30d': { label: 'Last 30 Days', getRange: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 30);
        return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
    }},
    '90d': { label: 'Last 90 Days', getRange: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 90);
        return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
    }},
    '365d': { label: 'Last 365 Days', getRange: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 365);
        return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
    }},
    'ytd': { label: 'Year to Date', getRange: () => {
        const end = new Date();
        const start = new Date(end.getFullYear(), 0, 1);
        return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
    }},
};

const StatCard: React.FC<{
    title: string;
    icon: React.ReactNode;
    accentColor: string;
    currentValue: number;
    previousValue?: number;
    formatAsCurrency?: boolean;
}> = ({ title, icon, accentColor, currentValue, previousValue, formatAsCurrency = false }) => {
    
    const formatValue = (value: number) => {
        if (formatAsCurrency) {
            return `$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        return value.toLocaleString();
    };

    const calculateTrend = () => {
        if (previousValue === undefined) return null;
        if (previousValue === currentValue) return { value: '0.0%', direction: 'stale' as const };
        
        const change = currentValue - previousValue;
        const percentageChange = previousValue === 0 
            ? (change > 0 ? 100 : 0) 
            : (change / Math.abs(previousValue)) * 100;
        
        return {
            value: `${percentageChange.toFixed(1)}%`,
            direction: change > 0 ? 'up' as const : 'down' as const,
        };
    };

    const trend = calculateTrend();
    const trendColor = trend?.direction === 'up' ? 'text-success' : trend?.direction === 'down' ? 'text-danger' : 'text-body-color';

    return (
        <div className={`rounded-lg border border-stroke bg-white py-6 px-7 shadow-md dark:border-strokedark dark:bg-box-dark border-l-4 ${accentColor}`}>
            <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gray-2 dark:bg-box-dark-2">
                    {icon}
                </div>
                <div>
                    <span className="text-sm font-medium text-body-color">{title}</span>
                    <h4 className="text-3xl font-bold text-black dark:text-white mt-1">{formatValue(currentValue)}</h4>
                </div>
            </div>
             {trend && (
                <div className={`mt-4 flex items-center gap-1 text-sm ${trendColor}`}>
                    {trend.direction === 'up' && <TrendUpIcon />}
                    {trend.direction === 'down' && <TrendDownIcon />}
                    <span>{trend.value}</span>
                    <span className="text-body-color dark:text-gray-300">vs previous period</span>
                </div>
            )}
        </div>
    );
};


const DashboardPage: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedRange, setSelectedRange] = useState<DateRangeOption>('30d');

    const fetchData = useCallback(async (range: DateRangeOption) => {
        setLoading(true);
        try {
            const dateRange = dateRanges[range].getRange();
            const [statsData, transactionsData] = await Promise.all([
                api.getDashboardStats(dateRange),
                api.getRecentTransactions(),
            ]);
            setStats(statsData);
            setRecentTransactions(transactionsData);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch dashboard data.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData(selectedRange);
    }, [selectedRange, fetchData]);
    
    const handleRangeChange = (range: DateRangeOption) => {
        setSelectedRange(range);
    };

    const statusPieData = stats ? Object.entries(stats.studentStatusDistribution).map(([name, value]) => ({ name, value })) : [];
    const PIE_COLORS = ['#3C50E0', '#80CAEE', '#FFBB28', '#FF8042']; // primary, secondary-ish, warning, danger-ish

    if (loading && !stats) {
        return (
            <>
                <PageHeader title="Dashboard" />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
                    <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
                </div>
            </>
        );
    }
    
    if (error) return <div className="text-danger p-4 bg-danger/10 rounded">{error}</div>;

    return (
        <>
            <PageHeader title="Dashboard">
                <div className="flex items-center bg-white dark:bg-box-dark rounded-md border border-stroke dark:border-strokedark">
                    {(Object.keys(dateRanges) as DateRangeOption[]).map(rangeKey => (
                         <button 
                            key={rangeKey} 
                            onClick={() => handleRangeChange(rangeKey)}
                            className={`px-4 py-2 text-sm font-medium border-r border-stroke dark:border-strokedark last:border-r-0 rounded-l-md last:rounded-r-md transition-colors ${selectedRange === rangeKey ? 'bg-primary text-white' : 'text-black dark:text-white hover:bg-gray-2 dark:hover:bg-box-dark-2'}`}
                        >
                            {dateRanges[rangeKey].label}
                        </button>
                    ))}
                </div>
            </PageHeader>
            <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
                    <StatCard 
                        title="Total Students" 
                        currentValue={stats?.stats.totalStudents ?? 0}
                        previousValue={stats?.trends.totalStudents} 
                        icon={<StudentsIcon />} 
                        accentColor="border-primary"
                    />
                    <StatCard 
                        title="Net Balance" 
                        currentValue={stats?.stats.netBalance ?? 0}
                        previousValue={stats?.trends.netBalance}
                        formatAsCurrency
                        icon={<TransactionsIcon />} 
                        accentColor="border-success"
                    />
                    <StatCard 
                        title="Active Students" 
                        currentValue={stats?.stats.activeStudents ?? 0}
                        previousValue={stats?.trends.activeStudents}
                        icon={<StudentsIcon />} 
                        accentColor="border-secondary"
                    />
                    <StatCard 
                        title="Upcoming Filings" 
                        currentValue={stats?.stats.upcomingFilings ?? 0} 
                        icon={<FilingsIcon />} 
                        accentColor="border-warning"
                    />
                </div>
                
                <div className="grid grid-cols-12 gap-4 md:gap-6 2xl:gap-7.5">
                    <div className="col-span-12 xl:col-span-8 rounded-lg border border-stroke bg-white p-6 shadow-md dark:border-strokedark dark:bg-box-dark flex flex-col min-h-[480px]">
                        <h3 className="text-xl font-semibold mb-4 text-black dark:text-white flex-shrink-0">Income vs. Expense (Last 12 Months)</h3>
                        <div className="flex-grow">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats?.monthlyBreakdown}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--stroke-color, #E2E8F0)" />
                                    <XAxis dataKey="month" tick={{ fill: 'var(--text-color-secondary, #64748B)', fontSize: 12 }} />
                                    <YAxis tick={{ fill: 'var(--text-color-secondary, #64748B)', fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'var(--box-dark)', border: '1px solid var(--stroke-color)', borderRadius: '8px' }}
                                        cursor={{ fill: 'rgba(128, 128, 128, 0.1)' }}
                                        formatter={(value) => `$${Number(value).toLocaleString()}`}
                                    />
                                    <Legend />
                                    <Bar dataKey="income" fill="#3C50E0" name="Income" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="expense" fill="#80CAEE" name="Expense" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    
                    <div className="col-span-12 xl:col-span-4 grid grid-rows-2 gap-4 md:gap-6 2xl:gap-7.5">
                        <div className="row-span-1 rounded-lg border border-stroke bg-white p-6 shadow-md dark:border-strokedark dark:bg-box-dark flex flex-col">
                            <h3 className="text-xl font-semibold mb-2 text-black dark:text-white flex-shrink-0">Student Status</h3>
                            <div className="flex-grow w-full h-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={statusPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                            {statusPieData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip formatter={(value) => `${value} students`} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="row-span-1 rounded-lg border border-stroke bg-white p-6 shadow-md dark:border-strokedark dark:bg-box-dark flex flex-col">
                            <h3 className="text-xl font-semibold mb-4 text-black dark:text-white flex-shrink-0">Recent Transactions</h3>
                            <div className="space-y-4 flex-grow overflow-y-auto">
                                {recentTransactions.map(t => (
                                    <div key={t.id} className="flex items-center gap-4">
                                        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${t.type === TransactionType.INCOME ? 'bg-success/10' : 'bg-danger/10'}`}>
                                            {t.type === TransactionType.INCOME ? <IncomeIcon className="text-success h-5 w-5" /> : <ExpenseIcon className="text-danger h-5 w-5" />}
                                        </div>
                                        <div className="flex-grow">
                                            <p className="font-medium text-black dark:text-white truncate">{t.description}</p>
                                            <p className="text-sm text-body-color dark:text-gray-300">{new Date(t.date).toLocaleDateString()}</p>
                                        </div>
                                        <span className={`font-semibold text-lg flex-shrink-0 ${t.type === TransactionType.INCOME ? 'text-success' : 'text-danger'}`}>
                                            {t.type === TransactionType.INCOME ? '+' : '-'}${Number(t.amount).toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default DashboardPage;