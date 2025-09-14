import React, { useState, useRef, useEffect } from 'react';
import { SparklesIcon, CloseIcon } from './Icons.tsx';
import { api } from '@/services/api.ts';
import { useNotification } from '@/contexts/NotificationContext.tsx';
import { useUI } from '@/contexts/UIContext.tsx';
import Button from './ui/Button.tsx';
import { exportToCsv, exportToPdf, exportFinancialCsvWithSummary } from '@/utils/exportUtils.ts';
import { Transaction, TransactionType } from '@/types.ts';

interface Message {
    role: 'user' | 'model';
    text: string;
}

const AIAssistant: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { showToast } = useNotification();
    const { isBulkActionBarVisible } = useUI();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleReportGeneration = (reportPayload: any) => {
        const { type, format, data, startDate, endDate } = reportPayload;
        const now = new Date().toISOString().split('T')[0];

        if (type === 'student_roster') {
            if (!data || data.length === 0) {
                showToast('The AI assistant returned no student data to generate a report.', 'info');
                return;
            }
            const headers = {
                studentId: 'Student ID',
                firstName: 'First Name',
                lastName: 'Last Name',
                dateOfBirth: 'Date of Birth',
                gender: 'Gender',
                studentStatus: 'Status',
                sponsorshipStatus: 'Sponsorship',
                sponsorName: 'Sponsor',
                school: 'School',
                currentGrade: 'Grade',
            };
            const fileName = `AI_Student_Roster_${now}`;
            if (format === 'csv') {
                exportToCsv(data, headers, `${fileName}.csv`);
            } else if (format === 'pdf') {
                exportToPdf(data, headers, 'AI Generated Student Roster', `${fileName}.pdf`);
            }
        } else if (type === 'financial') {
             if (!data || data.length === 0) {
                showToast('The AI assistant returned no transaction data to generate a report.', 'info');
                return;
            }
            const totalIncome = data.filter((t: Transaction) => t.type === TransactionType.INCOME).reduce((sum: number, t: Transaction) => sum + Number(t.amount), 0);
            const totalExpense = data.filter((t: Transaction) => t.type === TransactionType.EXPENSE).reduce((sum: number, t: Transaction) => sum + Number(t.amount), 0);
            const netBalance = totalIncome - totalExpense;
            
            const reportData = data.map((t: Transaction) => ({
                ...t,
                amount: `$${Number(t.amount).toFixed(2)}`,
            }));

            const headers = {
                date: 'Date',
                description: 'Description',
                category: 'Category',
                type: 'Type',
                amount: 'Amount',
            };
            
            const fileName = `AI_Financial_Report_${startDate}_to_${endDate}`;

            if (format === 'csv') {
                const summaryData = {
                    title: 'AI Generated Financial Summary',
                    range: `Date Range: ${startDate} to ${endDate}`,
                    income: `Total Income: $${totalIncome.toFixed(2)}`,
                    expense: `Total Expenses: $${totalExpense.toFixed(2)}`,
                    net: `Net Balance: $${netBalance.toFixed(2)}`,
                };
                exportFinancialCsvWithSummary(reportData, headers, summaryData, `${fileName}.csv`);
            } else if (format === 'pdf') {
                const summary = `Financial Summary from ${startDate} to ${endDate}\nTotal Income: $${totalIncome.toFixed(2)}\nTotal Expenses: $${totalExpense.toFixed(2)}\nNet Balance: $${netBalance.toFixed(2)}`;
                exportToPdf(reportData, headers, 'AI Generated Financial Report', `${fileName}.pdf`, summary);
            }
        }

        const modelMessage: Message = { role: 'model', text: `I have generated the ${type.replace(/_/g, ' ')} report for you. Your download should begin shortly.` };
        setMessages(prev => [...prev, modelMessage]);
    };

    const handleSendMessage = async (prompt: string) => {
        if (!prompt.trim()) return;

        const userMessage: Message = { role: 'user', text: prompt };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        const conversationHistory = messages.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.text }]
        }));

        try {
            const result = await api.queryAIAssistant(prompt, conversationHistory);
            
            if (result.response.startsWith('[GENERATE_REPORT]')) {
                const jsonString = result.response.replace('[GENERATE_REPORT]\n', '');
                try {
                    const reportPayload = JSON.parse(jsonString);
                    handleReportGeneration(reportPayload);
                } catch (e) {
                    console.error("Failed to parse report JSON from AI:", e);
                    showToast('The AI returned an invalid report format.', 'error');
                    const errorMessage: Message = { role: 'model', text: "I tried to generate a report, but the data was corrupted. Please try again." };
                    setMessages(prev => [...prev, errorMessage]);
                }
            } else {
                const modelMessage: Message = { role: 'model', text: result.response };
                setMessages(prev => [...prev, modelMessage]);
            }
        } catch (error: any) {
            showToast(error.message || 'Failed to get response from AI assistant.', 'error');
            const errorMessage: Message = { role: 'model', text: "Sorry, I encountered an error. Please try again." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSendMessage(input);
    };
    
    const examplePrompts = [
        "How many active students do we have?",
        "List all unsponsored students.",
        "Summarize our finances for last month.",
        "Generate a CSV report of all active students.",
    ];

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className={`fixed right-6 z-40 w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-all duration-300 transform hover:scale-110 no-print ${
                    isBulkActionBarVisible ? 'bottom-24' : 'bottom-6'
                }`}
                aria-label="Open AI Assistant"
            >
                <SparklesIcon className="w-8 h-8" />
            </button>

            {isOpen && (
                <div 
                    className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm no-print"
                    onClick={() => setIsOpen(false)}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        className="fixed bottom-0 right-0 top-0 sm:top-auto sm:bottom-6 sm:right-6 w-full sm:w-[440px] h-full sm:h-[70vh] max-h-full sm:max-h-[704px] flex flex-col bg-white dark:bg-box-dark rounded-none sm:rounded-lg shadow-2xl border border-stroke dark:border-strokedark"
                    >
                        <header className="flex items-center justify-between p-4 border-b border-stroke dark:border-strokedark flex-shrink-0">
                            <div className="flex items-center gap-2">
                                <SparklesIcon className="w-6 h-6 text-primary" />
                                <h2 className="text-lg font-semibold text-black dark:text-white">AI Assistant</h2>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-gray-2 dark:hover:bg-box-dark-2">
                                <CloseIcon className="w-6 h-6" />
                            </button>
                        </header>
                        <main className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.length === 0 ? (
                                <div className="text-center text-body-color dark:text-gray-400 h-full flex flex-col justify-center">
                                    <p className="mb-4">Ask me anything about your data.</p>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        {examplePrompts.map(prompt => (
                                            <button 
                                                key={prompt}
                                                onClick={() => handleSendMessage(prompt)}
                                                className="p-2 rounded-lg border border-stroke dark:border-strokedark text-left hover:bg-gray-2 dark:hover:bg-box-dark-2 transition-colors"
                                            >
                                                {prompt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                messages.map((msg, index) => (
                                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div
                                            className={`max-w-xs md:max-w-md px-4 py-2 rounded-xl ${
                                                msg.role === 'user'
                                                    ? 'bg-primary text-white'
                                                    : 'bg-gray-2 dark:bg-box-dark-2 text-black dark:text-white'
                                            }`}
                                        >
                                            <div className="whitespace-pre-wrap">{msg.text}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                             {isLoading && (
                                <div className="flex justify-start">
                                    <div className="max-w-xs md:max-w-md px-4 py-2 rounded-xl bg-gray-2 dark:bg-box-dark-2 text-black dark:text-white">
                                        <div className="flex items-center gap-2">
                                           <div className="w-2 h-2 bg-body-color rounded-full animate-pulse delay-75"></div>
                                           <div className="w-2 h-2 bg-body-color rounded-full animate-pulse delay-150"></div>
                                           <div className="w-2 h-2 bg-body-color rounded-full animate-pulse delay-300"></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </main>
                        <footer className="p-4 border-t border-stroke dark:border-strokedark">
                            <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    placeholder="Ask a question..."
                                    className="w-full rounded-lg border-[1.5px] border-stroke bg-gray-2 py-2 px-4 font-medium outline-none transition focus:border-primary text-black dark:border-strokedark dark:bg-form-input dark:text-white"
                                    disabled={isLoading}
                                />
                                <Button type="submit" disabled={isLoading || !input.trim()} isLoading={isLoading}>
                                    Send
                                </Button>
                            </form>
                        </footer>
                    </div>
                </div>
            )}
        </>
    );
};

export default AIAssistant;