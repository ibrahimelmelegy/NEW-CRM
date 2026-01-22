
import React from 'react';
import {
    FileText, CheckCircle, Clock, Hexagon
} from 'lucide-react';
import { ProposalData } from './types';

// --- STYLES & LAYOUT ENGINE ---

// Use a CSS style block for absolute print control
const PrintStyles = () => (
    <style>{`
        @page {
            size: A4;
            margin: 0 !important;
        }
        @media print {
            body {
                margin: 0 !important;
                padding: 0 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                background-color: white !important;
            }
            .page-container {
                margin: 0 !important;
                padding: 0 !important;
                width: 210mm !important;
                height: 297mm !important;
                page-break-after: always !important;
                position: relative !important;
                overflow: hidden !important;
            }
        }
        /* Rich Text Normalization */
        .proposal-rich-text h1 { font-size: 1.5em; font-weight: 800; margin-top: 1em; margin-bottom: 0.5em; color: #111827; }
        .proposal-rich-text h2 { font-size: 1.25em; font-weight: 700; margin-top: 1em; margin-bottom: 0.5em; color: #1f2937; }
        .proposal-rich-text h3 { font-size: 1.1em; font-weight: 600; margin-top: 0.8em; margin-bottom: 0.4em; color: #374151; }
        .proposal-rich-text p { margin-bottom: 0.8em; line-height: 1.6; color: #4b5563; }
        .proposal-rich-text ul { list-style-type: disc; margin-left: 1.5em; margin-bottom: 0.8em; }
        .proposal-rich-text table { width: 100%; border-collapse: collapse; margin: 1em 0; }
        .proposal-rich-text th, .proposal-rich-text td { border: 1px solid #e5e7eb; padding: 0.6em; }
    `}</style>
);

interface PageProps {
    children: React.ReactNode;
    pageNum?: number;
    data?: ProposalData;
    isCover?: boolean;
    className?: string;
}

const Page: React.FC<PageProps> = ({ children, pageNum, data, isCover, className = '' }) => (
    <div className={`page-container bg-white shadow-2xl mx-auto print:shadow-none ${className}`}
        style={{
            width: '210mm',
            height: '297mm',
            position: 'relative',
            overflow: 'hidden'
        }}>

        {/* Background Helper */}
        <div className="absolute inset-0 -z-10 bg-white"></div>

        {!isCover && (
            <>
                {/* Header Section */}
                <div className="absolute top-0 left-0 right-0 h-32 z-50">
                    <div className="h-1.5 w-full bg-gradient-to-r from-violet-600 to-blue-600"></div>
                    <div className="flex justify-between items-center h-28 border-b border-gray-100 px-12">
                        <div className="h-10">
                            <img
                                src="/assets/header-logo.png"
                                className="h-full w-auto object-contain"
                                alt="High Point"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.parentElement!.innerHTML = '<span class="text-xs font-bold text-violet-700 uppercase tracking-tighter">High Point Technology</span>';
                                }}
                            />
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Ref: {data?.refNumber}</div>
                            <div className="text-xs font-bold text-violet-600 mt-1 uppercase">Version {data?.version}.0</div>
                        </div>
                    </div>
                </div>

                {/* Footer Section */}
                <div className="absolute bottom-0 left-0 right-0 h-20 px-12 flex justify-between items-center z-50">
                    <div className="absolute top-0 left-12 right-12 h-px bg-gray-100"></div>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-opacity-50">Confidential</span>
                    </div>
                    <div className="text-[10px] font-mono text-gray-400">Page {pageNum}</div>
                </div>
            </>
        )}

        {/* Content Box */}
        <div className={`absolute inset-0 ${!isCover ? 'pt-36 pb-20' : 'flex flex-col'}`}>
            {children}
        </div>
    </div>
);

export const ProposalPrintTemplate: React.FC<{ data: ProposalData }> = ({ data }) => {
    if (!data) return null;

    const subtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const discountAmount = data.discountType === 'percent' ? subtotal * (data.discount / 100) : data.discount;
    const taxableAmount = subtotal - discountAmount;
    const tax = taxableAmount * (data.taxRate / 100);
    const total = taxableAmount + tax;
    const color = data.themeColor || '#7c3aed';
    const fontClass = data.font === 'serif' ? 'font-serif' : data.font === 'mono' ? 'font-mono' : 'font-sans';

    const typeInfo = (() => {
        const t = data.type || 'MIXED';
        if (t === 'FINANCIAL') return { label: 'Financial', fullLabel: 'Financial Proposal', color: 'emerald' };
        if (t === 'TECHNICAL') return { label: 'Technical', fullLabel: 'Technical Proposal', color: 'blue' };
        return { label: 'Mixed', fullLabel: 'Comprehensive Proposal', color: 'violet' };
    })();


    // Get labels defaulting to standard names
    const defaultLabels = {
        branding: 'Branding & Details',
        executive: 'Executive Summary',
        solution: 'Solution & Scope',
        financial: 'Investment',
        legal: 'Terms & Legal'
    };
    const labels = {
        ...defaultLabels,
        ...data.stepLabels
    };

    // --- Content Renderers ---
    const renderSectionContent = (id: string, index: number) => {
        const commonPadding = "px-4"; // Minimal padding, relying on Page's structural padding

        if (id === 'executive') {
            return (
                <Page key={id} pageNum={index} data={data}>
                    <div className={`flex-1 ${commonPadding}`}>
                        <div className="mb-10">
                            <h2 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                                <span className="text-gray-200 font-mono">0{index}</span>
                                {labels.executive}
                            </h2>
                            <div className="proposal-rich-text mb-8" dangerouslySetInnerHTML={{ __html: data.introduction }}></div>
                            {data.objectives && (
                                <div className="bg-gray-50 p-8 rounded-xl border-l-4" style={{ borderColor: color }}>
                                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <CheckCircle size={18} style={{ color: color }} /> Objectives
                                    </h3>
                                    <div className="proposal-rich-text" dangerouslySetInnerHTML={{ __html: data.objectives }}></div>
                                </div>
                            )}
                        </div>
                    </div>
                </Page>
            );
        }

        if (id === 'solution') {
            return (
                <Page key={id} pageNum={index} data={data}>
                    <div className={`flex-1 ${commonPadding}`}>
                        <div className="mb-10">
                            <h2 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                                <span className="text-gray-200 font-mono">0{index}</span>
                                {labels.solution}
                            </h2>
                            {data.scopeOfWork && (
                                <div className="mb-8">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Scope of Work</h3>
                                    <div className="proposal-rich-text" dangerouslySetInnerHTML={{ __html: data.scopeOfWork }}></div>
                                </div>
                            )}
                            {data.methodology && (
                                <div className="mb-8">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Methodology</h3>
                                    <div className="proposal-rich-text" dangerouslySetInnerHTML={{ __html: data.methodology }}></div>
                                </div>
                            )}
                            {data.phases.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Timeline</h3>
                                    <div className="space-y-6">
                                        {data.phases.map((phase, idx) => (
                                            <div key={idx} className="flex gap-6">
                                                <div className="flex flex-col items-center">
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                                                    <div className="w-px h-full bg-gray-100 mt-1"></div>
                                                </div>
                                                <div className="pb-6">
                                                    <div className="flex items-baseline gap-4 mb-1">
                                                        <span className="font-bold text-gray-900">{phase.name}</span>
                                                        <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{phase.duration}</span>
                                                    </div>
                                                    <p className="text-sm text-gray-500">{phase.deliverables}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </Page>
            );
        }

        if (id === 'financial') {
            return (
                <Page key={id} pageNum={index} data={data}>
                    <div className={`flex-1 ${commonPadding}`}>
                        <h2 className="text-3xl font-bold text-gray-900 mb-10 flex items-center gap-3">
                            <span className="text-gray-200 font-mono">0{index}</span>
                            {labels.financial}
                        </h2>

                        <div className="mb-12">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b-2 border-gray-100">
                                        <th className="py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Description</th>
                                        <th className="py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Qty</th>
                                        <th className="py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Rate</th>
                                        <th className="py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {data.items.map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="py-4 pr-4">
                                                <p className="font-bold text-gray-800 text-sm">{item.description}</p>
                                                <p className="text-xs text-gray-400 mt-0.5">{item.unit}</p>
                                            </td>
                                            <td className="py-4 text-right text-sm text-gray-600">{item.quantity}</td>
                                            <td className="py-4 text-right text-sm text-gray-600">{item.rate.toLocaleString()}</td>
                                            <td className="py-4 text-right text-sm font-bold text-gray-900">{(item.quantity * item.rate).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-end">
                            <div className="w-64 space-y-3 bg-gray-50 p-6 rounded-xl">
                                <div className="flex justify-between text-sm text-gray-500">
                                    <span>Subtotal</span>
                                    <span>{subtotal.toLocaleString()} {data.currency}</span>
                                </div>
                                {discountAmount > 0 && (
                                    <div className="flex justify-between text-sm text-green-600">
                                        <span>Discount</span>
                                        <span>- {discountAmount.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm text-gray-500 border-b border-gray-200 pb-3">
                                    <span>Tax ({data.taxRate}%)</span>
                                    <span>{tax.toLocaleString()} {data.currency}</span>
                                </div>
                                <div className="flex justify-between items-baseline pt-1">
                                    <span className="text-sm font-bold text-gray-900">Total</span>
                                    <span className="text-xl font-bold" style={{ color: color }}>{total.toLocaleString()} {data.currency}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </Page>
            );
        }

        if (id === 'legal') {
            return (
                <Page key={id} pageNum={index} data={data}>
                    <div className={`flex-1 ${commonPadding} flex flex-col`}>
                        <h2 className="text-3xl font-bold text-gray-900 mb-10 flex items-center gap-3">
                            <span className="text-gray-200 font-mono">0{index}</span>
                            {labels.legal}
                        </h2>
                        <div className="grid grid-cols-1 gap-12 flex-1">
                            {data.termsAndConditions && (
                                <div>
                                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <FileText size={18} className="text-gray-400" /> Terms & Conditions
                                    </h3>
                                    <div className="proposal-rich-text text-sm text-gray-600" dangerouslySetInnerHTML={{ __html: data.termsAndConditions }}></div>
                                </div>
                            )}
                            {data.paymentTerms && (
                                <div>
                                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <Clock size={18} className="text-gray-400" /> Payment Schedule
                                    </h3>
                                    <div className="proposal-rich-text text-sm text-gray-600" dangerouslySetInnerHTML={{ __html: data.paymentTerms }}></div>
                                </div>
                            )}
                        </div>
                    </div>
                </Page>
            );
        }

        const customSection = data.customSections?.find(s => s.id === id);
        if (customSection) {
            return (
                <Page key={id} pageNum={index} data={data}>
                    <div className={`flex-1 ${commonPadding}`}>
                        <h2 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                            <span className="text-gray-200 font-mono">0{index}</span>
                            {customSection.title}
                        </h2>
                        <div className="proposal-rich-text" dangerouslySetInnerHTML={{ __html: customSection.content }}></div>
                    </div>
                </Page>
            );
        }

        return null;
    };

    // --- COVER PAGE STYLES ---

    const CoverPage = ({ data, color, typeInfo }: { data: ProposalData, color: string, typeInfo: any }) => {
        // 0. CORPORATE
        if (data.coverStyle === 'corporate') {
            return (
                <Page isCover>
                    <div className="flex-1 flex flex-row h-full">
                        <div className="w-1/3 bg-slate-800 text-white p-12 flex flex-col justify-between border-r-8" style={{ borderColor: color }}>
                            <div className="space-y-12">
                                {data.logo ? (
                                    <img src={data.logo} className="h-12 w-auto brightness-0 invert" alt="Logo" />
                                ) : (
                                    <div className="text-3xl font-bold tracking-tighter">HP.</div>
                                )}

                                <div className="space-y-8">
                                    <div>
                                        <span className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-2">Prepared For</span>
                                        <p className="text-xl font-bold leading-tight">{data.clientCompany}</p>
                                        <p className="text-slate-300 text-sm mt-1">{data.clientName}</p>
                                    </div>

                                    <div className="pt-4 border-t border-slate-700">
                                        <span className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-2">Proposal Details</span>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-500">Date</span>
                                                <span className="font-medium">{data.date}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-500">Version</span>
                                                <span className="font-medium">v{data.version}.0</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                                {data.refNumber}
                            </div>
                        </div>

                        <div className="w-2/3 bg-white p-20 flex flex-col justify-center relative">
                            {data.clientLogo && (
                                <div className="absolute top-12 right-12 h-16 w-32 flex justify-end items-center opacity-40 grayscale">
                                    <img src={data.clientLogo} className="h-full w-auto object-contain" alt="Client Logo" />
                                </div>
                            )}

                            <div className="mb-10">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-100 mb-6">
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></span>
                                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
                                        {typeInfo.fullLabel}
                                    </span>
                                </div>
                                <h1 className="text-6xl font-black text-slate-900 leading-[1.1] mb-6">
                                    {data.title}
                                </h1>
                                <div className="w-24 h-2 rounded-full" style={{ backgroundColor: color }}></div>
                            </div>

                            <div className="mt-12">
                                <p className="text-slate-400 text-sm italic max-w-md">
                                    This strategic proposal outlines our comprehensive solution designed to address the specific needs and objectives of {data.clientCompany}.
                                </p>
                            </div>
                        </div>
                    </div>
                </Page>
            );
        }

        // 1. BUSINESS
        if (data.coverStyle === 'business') {
            return (
                <Page isCover>
                    <div className="flex-1 flex flex-row h-full">
                        <div className="w-1/3 bg-gray-900 text-white p-12 flex flex-col justify-between">
                            <div className="space-y-12">
                                {data.logo ? (
                                    <img src={data.logo} className="h-10 w-auto brightness-0 invert opacity-80" alt="Logo" />
                                ) : (
                                    <div className="text-2xl font-bold tracking-tight">HIGH POINT</div>
                                )}
                                <div className="space-y-8">
                                    <div>
                                        <span className="block text-xs opacity-50 uppercase tracking-wider mb-2">Prepared For</span>
                                        <p className="font-bold text-lg leading-tight">{data.clientCompany}</p>
                                        <p className="opacity-70 text-sm">{data.clientName}</p>
                                    </div>
                                    <div className="space-y-4 pt-4 border-t border-white/10">
                                        <div>
                                            <span className="block text-[10px] opacity-40 uppercase tracking-widest mb-1">Date</span>
                                            <p className="text-sm font-medium">{data.date}</p>
                                        </div>
                                        <div>
                                            <span className="block text-[10px] opacity-40 uppercase tracking-widest mb-1">Ref ID</span>
                                            <p className="text-sm font-medium">{data.refNumber}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="text-xs opacity-40 font-mono">
                                v{data.version}.0
                            </div>
                        </div>
                        <div className="w-2/3 bg-white p-20 flex flex-col justify-center relative">
                            {data.clientLogo && (
                                <img src={data.clientLogo} className="absolute top-12 right-12 h-12 w-auto opacity-20 grayscale" alt="Client Logo" />
                            )}
                            <div className="flex items-center gap-3 mb-6">
                                <span className="font-bold tracking-wider uppercase text-sm" style={{ color: color }}>
                                    Strategic Proposal
                                </span>
                                <span className="w-px h-4 bg-gray-300"></span>
                                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm bg-${typeInfo.color}-100 text-${typeInfo.color}-800`}>
                                    {typeInfo.fullLabel}
                                </span>
                            </div>
                            <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-8">{data.title}</h1>
                            <div className="w-20 h-2" style={{ backgroundColor: color }}></div>
                        </div>
                    </div>
                </Page>
            );
        }

        // 2. CREATIVE
        if (data.coverStyle === 'creative') {
            return (
                <Page isCover>
                    <div className="flex-1 flex flex-col justify-between p-20 relative overflow-hidden h-full">
                        {/* Geometric Background Shapes */}
                        <div className="absolute top-0 right-0 w-[80%] h-full transform skew-x-12 origin-top-right z-0" style={{ backgroundColor: `${color}10` }}></div>
                        <div className="absolute bottom-0 left-0 w-full h-[40%] transform -skew-y-6 origin-bottom-left z-0" style={{ backgroundColor: color }}></div>

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-16">
                                {data.logo ? (
                                    <img src={data.logo} className="h-16 w-auto" alt="Logo" />
                                ) : (
                                    <div className="text-3xl font-black tracking-tighter">HP.</div>
                                )}
                                {data.clientLogo && (
                                    <img src={data.clientLogo} className="h-10 w-auto opacity-30 grayscale" alt="Client Logo" />
                                )}
                            </div>

                            <div className="max-w-2xl">
                                <div className="flex gap-3 mb-6">
                                    <span className="inline-block px-3 py-1 text-sm font-bold tracking-widest uppercase border-2 border-black">
                                        Proposal
                                    </span>
                                    <span className="inline-block px-3 py-1 text-sm font-bold tracking-widest uppercase bg-black text-white">
                                        {typeInfo.label}
                                    </span>
                                </div>
                                <h1 className="text-7xl font-black leading-none mb-6 text-gray-900">
                                    {data.title}
                                </h1>
                                <p className="text-xl text-gray-600 font-medium">
                                    Prepared for {data.clientCompany}
                                </p>
                            </div>
                        </div>

                        <div className="relative z-10 flex justify-between items-end text-white">
                            <div className="flex gap-12">
                                <div>
                                    <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mb-1">Date</p>
                                    <p className="text-lg font-bold">{data.date}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mb-1">Version</p>
                                    <p className="text-lg font-bold">v{data.version}.0</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mb-1">Reference</p>
                                <p className="text-lg font-mono font-bold tracking-tighter">{data.refNumber}</p>
                            </div>
                        </div>
                    </div>
                </Page>
            );
        }

        // 3. ENTERPRISE
        if (data.coverStyle === 'enterprise') {
            return (
                <Page isCover>
                    <div className="flex-1 flex flex-col p-16">
                        {/* Top Bar */}
                        <div className="w-full h-2 mb-16" style={{ backgroundColor: color }}></div>

                        <div className="flex justify-between items-start mb-24">
                            <div>
                                {data.logo ? <img src={data.logo} className="h-12 w-auto" alt="Logo" /> : <div className="font-bold text-2xl text-gray-800">High Point</div>}
                            </div>
                            <div className="flex items-center gap-6">
                                {data.clientLogo && <img src={data.clientLogo} className="h-8 w-auto grayscale opacity-50" alt="Client Logo" />}
                                <div className="text-right">
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Confidential</p>
                                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">{data.refNumber}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1">
                            <h1 className="text-5xl font-bold text-gray-900 mb-8 leading-tight max-w-3xl">
                                {data.title}
                            </h1>
                            <div className="w-24 h-1 bg-gray-200 mb-8"></div>
                            <div className={`inline-block mb-12 px-3 py-1 text-xs font-bold uppercase tracking-wider bg-${typeInfo.color}-100 text-${typeInfo.color}-800 border border-${typeInfo.color}-200`}>
                                {typeInfo.fullLabel}
                            </div>

                            <div className="bg-gray-50 border border-gray-200 p-8 max-w-md">
                                <div className="mb-6">
                                    <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Prepared For</span>
                                    <p className="text-xl font-bold text-gray-900">{data.clientCompany}</p>
                                    <p className="text-gray-600">{data.clientName}</p>
                                </div>
                                <div className="flex justify-between items-end border-t border-gray-200 pt-6">
                                    <div>
                                        <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Prepared By</span>
                                        <p className="text-sm font-bold text-gray-900">High Point Technology</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Version</span>
                                        <p className="text-xs font-bold font-mono">v{data.version}.0</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Grid */}
                        <div className="grid grid-cols-3 gap-8 border-t-2 border-gray-100 pt-8 mt-auto">
                            <div>
                                <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Date Issued</span>
                                <p className="font-mono text-sm">{data.date}</p>
                            </div>
                            <div>
                                <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Valid Until</span>
                                <p className="font-mono text-sm">{data.validUntil}</p>
                            </div>
                            <div>
                                <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Reference ID</span>
                                <p className="font-mono text-sm">{data.refNumber}</p>
                            </div>
                        </div>
                    </div>
                </Page>
            );
        }

        // 4. TECH
        if (data.coverStyle === 'tech') {
            return (
                <Page isCover className="bg-slate-900 text-white font-mono">
                    <div className="flex-1 flex flex-col p-16 relative overflow-hidden">
                        {/* Grid Background */}
                        <div className="absolute inset-0 opacity-20 pointer-events-none"
                            style={{
                                backgroundImage: `radial-gradient(${color} 1px, transparent 1px)`,
                                backgroundSize: '30px 30px'
                            }}>
                        </div>

                        <div className="relative z-10 flex justify-between items-start mb-32">
                            <div className="flex items-center gap-2 border border-slate-700 bg-slate-800/50 px-4 py-2 rounded-full">
                                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: color }}></div>
                                <span className="text-xs tracking-widest">SYSTEM_PROPOSAL_V{data.version}.0</span>
                                <span className="text-xs tracking-widest opacity-50 pl-2 border-l border-slate-600">TYPE: {data.type || 'MIXED'}</span>
                            </div>
                            <div className="text-right">
                                <p className="text-xs opacity-50 mb-1">doc_ref_id</p>
                                <p className="text-sm">{data.refNumber}</p>
                            </div>
                        </div>

                        <div className="relative z-10 flex-1">
                            <h1 className="text-6xl font-bold mb-8 leading-tight tracking-tight">
                                <span style={{ color: color }}>&gt;</span> {data.title}_
                            </h1>
                            <div className="border-l-2 pl-6" style={{ borderColor: color }}>
                                <p className="text-sm text-slate-400 uppercase tracking-widest mb-2">Target Client</p>
                                <p className="text-3xl font-bold">{data.clientCompany}</p>
                            </div>
                        </div>

                        <div className="relative z-10 border-t border-slate-800 pt-8 flex justify-between items-end">
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Generated By</p>
                                <p className="font-bold">High Point Tech Algo</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-500 mb-1">Timestamp</p>
                                <p className="font-bold">{data.date}</p>
                            </div>
                        </div>
                    </div>
                </Page>
            );
        }

        // 5. MINIMAL
        if (data.coverStyle === 'minimal') {
            return (
                <Page isCover>
                    <div className="flex-1 flex flex-col items-center justify-center p-24 text-center relative">
                        {data.clientLogo && (
                            <div className="absolute top-12 right-12 opacity-20 grayscale">
                                <img src={data.clientLogo} className="h-10 w-auto" alt="Client Logo" />
                            </div>
                        )}
                        <div className="mb-16">
                            {data.logo ? <img src={data.logo} className="h-20 w-auto object-contain mx-auto opacity-80" alt="Logo" /> : <div className="text-xl font-bold tracking-widest uppercase">High Point</div>}
                        </div>

                        <div className="w-16 h-1 bg-gray-900 mb-12"></div>

                        <h1 className="text-4xl font-light tracking-tight text-gray-900 mb-6 leading-tight max-w-2xl italic">
                            {data.title}
                        </h1>

                        <p className="text-sm text-gray-400 uppercase tracking-widest mb-16">
                            Project Proposal • <span className="font-bold underline decoration-2" style={{ textDecorationColor: color }}>{typeInfo.label}</span>
                        </p>

                        <div className="text-sm text-gray-500 space-y-4 max-w-xs border-t border-gray-100 pt-8">
                            <div>
                                <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Prepared for</p>
                                <p className="text-gray-900 font-medium">{data.clientCompany}</p>
                            </div>
                            <div className="flex justify-center gap-8 text-[10px] uppercase tracking-widest text-gray-400">
                                <span>{data.date}</span>
                                <span>{data.refNumber}</span>
                                <span>v{data.version}.0</span>
                            </div>
                        </div>
                    </div>
                </Page>
            );
        }

        // 6. MODERN ART
        if (data.coverStyle === 'modern-art') {
            return (
                <Page isCover>
                    <div className="flex-1 relative overflow-hidden flex flex-col justify-center p-24 h-full">
                        {/* Background blobs */}
                        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-20" style={{ backgroundColor: color }}></div>
                        <div className="absolute bottom-[-5%] left-[-5%] w-[400px] h-[400px] rounded-full opacity-10" style={{ backgroundColor: color }}></div>

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-12">
                                {data.logo ? (
                                    <img src={data.logo} className="h-12 w-auto" alt="Logo" />
                                ) : (
                                    <div className="text-2xl font-bold">High Point</div>
                                )}
                                {data.clientLogo && (
                                    <img src={data.clientLogo} className="h-12 w-auto opacity-20 grayscale" alt="Client Logo" />
                                )}
                            </div>

                            <h1 className="text-7xl font-bold text-gray-900 mb-8 leading-[0.9] tracking-tighter">
                                {data.title}
                            </h1>

                            <div className="flex items-center gap-4 mb-16">
                                <div className="bg-gray-900 text-white px-3 py-1 text-xs font-bold uppercase tracking-widest">
                                    {typeInfo.label}
                                </div>
                                <div className="text-gray-400 text-xs font-medium uppercase tracking-widest">
                                    Prepared for <span className="text-gray-900 font-bold">{data.clientCompany}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8 border-t border-gray-100 pt-8 max-w-sm">
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-gray-300 mb-1">Date</p>
                                    <p className="text-sm font-medium text-gray-600">{data.date}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-gray-300 mb-1">Version</p>
                                    <p className="text-sm font-medium text-gray-600">v{data.version}.0</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-[10px] uppercase font-bold text-gray-300 mb-1">Reference</p>
                                    <p className="text-sm font-mono text-gray-500">{data.refNumber}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </Page>
            );
        }

        // 7. GEOMETRIC
        if (data.coverStyle === 'geometric') {
            return (
                <Page isCover>
                    <div className="flex-1 flex flex-row h-full">
                        <div className="w-2/5 bg-gray-900 text-white p-16 flex flex-col justify-between relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 transform rotate-45 translate-x-16 -translate-y-16"></div>

                            <div className="relative z-10">
                                {data.logo ? (
                                    <img src={data.logo} className="h-12 w-auto brightness-0 invert opacity-80 mb-20" alt="Logo" />
                                ) : (
                                    <div className="text-3xl font-bold mb-20 tracking-tighter">HP.G</div>
                                )}

                                <div className="space-y-12">
                                    <div>
                                        <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em] mb-4">Client Detail</span>
                                        <h2 className="text-3xl font-bold leading-tight">{data.clientCompany}</h2>
                                        <p className="text-gray-400 text-sm mt-2">{data.clientName}</p>
                                    </div>

                                    <div className="space-y-6 pt-12 border-t border-white/10">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Date</span>
                                            <span className="text-sm font-mono">{data.date}</span>
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Version</span>
                                            <span className="text-sm font-mono">v{data.version}.0</span>
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Ref ID</span>
                                            <span className="text-sm font-mono text-violet-400">{data.refNumber}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="relative z-10 mt-auto">
                                <div className="h-1 w-12" style={{ backgroundColor: color }}></div>
                            </div>
                        </div>

                        <div className="w-3/5 bg-white p-24 flex flex-col justify-center relative">
                            {data.clientLogo && (
                                <div className="absolute top-16 right-16 h-12 w-32 flex justify-end items-center opacity-30 grayscale">
                                    <img src={data.clientLogo} className="h-full w-auto object-contain" alt="Client Logo" />
                                </div>
                            )}

                            <div className="mb-12">
                                <span className={`inline-block px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] bg-gray-100 text-gray-600 mb-8`}>
                                    {typeInfo.fullLabel}
                                </span>
                                <h1 className="text-6xl font-black text-gray-900 leading-none mb-8 uppercase tracking-tighter">
                                    {data.title}
                                </h1>
                                <div className="flex gap-2">
                                    <div className="w-12 h-1 bg-gray-900"></div>
                                    <div className="w-12 h-1 bg-gray-200"></div>
                                    <div className="w-12 h-1 bg-gray-100"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Page>
            );
        }

        // 8. BOLD TYPOGRAPHY
        if (data.coverStyle === 'bold-typography') {
            return (
                <Page isCover>
                    <div className="flex-1 flex flex-col relative bg-white">
                        {/* Left color bar */}
                        <div className="absolute left-0 top-0 bottom-0 w-6" style={{ backgroundColor: color }}></div>

                        <div className="flex-1 flex flex-col justify-center px-24 py-20 relative z-10">
                            <div className="flex justify-between items-start mb-20">
                                {data.logo ? <img src={data.logo} className="h-16 w-auto" alt="Logo" /> : <div className="text-2xl font-bold">HP.TECH</div>}
                                {data.clientLogo && <img src={data.clientLogo} className="h-12 w-auto opacity-30 grayscale" alt="Client Logo" />}
                            </div>

                            <div className="mb-12">
                                <span className="block text-sm font-bold tracking-[0.3em] uppercase text-gray-400 mb-4">
                                    Project Proposal • <span className="text-gray-900">{typeInfo.label}</span>
                                </span>
                                <h1 className="text-8xl font-black text-slate-900 leading-[0.85] tracking-tighter">
                                    {data.title}
                                </h1>
                            </div>

                            <div className="w-24 h-2 bg-slate-900 mb-12"></div>

                            <div className="grid grid-cols-2 gap-16 max-w-2xl">
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Prepared For</p>
                                    <p className="text-2xl font-bold text-slate-800">{data.clientCompany}</p>
                                    <p className="text-slate-500 italic mt-1">{data.clientName}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Date</p>
                                        <p className="text-sm font-bold">{data.date}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Version</p>
                                        <p className="text-sm font-bold">v{data.version}.0</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Reference</p>
                                        <p className="text-sm font-mono font-bold text-slate-600">{data.refNumber}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Big ref number watermark */}
                        <div className="absolute bottom-10 right-10 text-9xl font-black text-gray-50 opacity-50 pointer-events-none select-none">
                            {new Date().getFullYear()}
                        </div>
                    </div>
                </Page>
            );
        }

        // 9. GRADIENT SPLASH
        if (data.coverStyle === 'gradient-splash') {
            return (
                <Page isCover>
                    <div className="flex-1 flex flex-col relative bg-white overflow-hidden">
                        {/* Top Gradient Curve */}
                        <div className="absolute top-0 left-0 w-full h-[60%] rounded-b-[100px] z-0"
                            style={{ background: `linear-gradient(135deg, ${color} 0%, #ffffff 150%)` }}>
                        </div>

                        <div className="relative z-10 p-20 flex flex-col h-full justify-between">
                            <div className="flex justify-between items-start text-white">
                                {data.logo ? (
                                    <img src={data.logo} className="h-16 w-auto brightness-0 invert" alt="Logo" />
                                ) : (
                                    <span className="text-2xl font-bold tracking-tight">HIGH POINT</span>
                                )}
                                {data.clientLogo && <img src={data.clientLogo} className="h-12 w-auto brightness-0 invert opacity-40" alt="Client Logo" />}
                            </div>

                            <div className="bg-white/90 backdrop-blur-xl p-12 rounded-3xl shadow-2xl border border-white/50 mt-20">
                                <span className="inline-block px-3 py-1 mb-6 text-xs font-bold tracking-widest uppercase bg-slate-900 text-white rounded">
                                    {typeInfo.label} Proposal
                                </span>
                                <h1 className="text-5xl font-bold text-slate-900 mb-6 leading-tight">
                                    {data.title}
                                </h1>
                                <p className="text-xl text-gray-500 font-medium mb-8">
                                    Prepared for <strong className="text-slate-900">{data.clientCompany}</strong>
                                </p>
                                <div className="flex gap-8 border-t border-gray-100 pt-6">
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Date</p>
                                        <p className="text-sm font-bold text-gray-900">{data.date}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Version</p>
                                        <p className="text-sm font-bold text-gray-900">v{data.version}.0</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Reference</p>
                                        <p className="text-sm font-mono text-gray-400">{data.refNumber}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between items-end mt-auto text-gray-400 text-sm font-medium">
                                <div>
                                    <p>Valid Until: {data.validUntil}</p>
                                    <p className="text-xs opacity-60">Confidential Document</p>
                                </div>
                                <div className="text-right">
                                    <p>High Point Technology</p>
                                    <p className="text-xs opacity-60">Ref: {data.refNumber}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </Page>
            );
        }

        // 10. SWISS (International Style)
        if (data.coverStyle === 'swiss') {
            return (
                <Page isCover>
                    <div className="flex-1 flex flex-col p-12 relative bg-[#f4f4f4]">
                        <div className="flex-1 grid grid-cols-12 grid-rows-6 gap-4 h-full border-t-4 border-black pt-8">
                            {/* Title Block */}
                            <div className="col-span-12 row-span-2">
                                <div className="flex justify-between items-start mb-4">
                                    <h1 className="text-8xl font-bold tracking-tighter leading-none text-black">
                                        {data.title}
                                    </h1>
                                    <div className="flex flex-col gap-2">
                                        <div className={`px-4 py-2 border-2 border-black text-xs font-bold uppercase tracking-widest bg-white`} style={{ backgroundColor: color }}>
                                            {typeInfo.label}
                                        </div>
                                        <div className="px-2 py-1 text-white text-[10px] font-bold text-center uppercase tracking-widest" style={{ backgroundColor: color }}>
                                            v{data.version}.0
                                        </div>
                                    </div>
                                </div>
                                <div className="w-32 h-2 mb-8" style={{ backgroundColor: color }}></div>
                                <div className="flex justify-between items-end border-b border-black pb-4">
                                    <span className="text-sm font-bold uppercase tracking-[0.2em]">Strategy Documentation</span>
                                    {data.clientLogo && <img src={data.clientLogo} className="h-8 w-auto grayscale contrast-200" alt="Client Logo" />}
                                </div>
                            </div>

                            {/* Client Info */}
                            <div className="col-span-4 row-span-2 col-start-1 row-start-4">
                                <p className="text-sm font-bold uppercase tracking-wide mb-2 text-gray-500">Prepared For</p>
                                <p className="text-xl font-bold text-black leading-tight mb-1">{data.clientCompany}</p>
                                <p className="text-lg text-gray-700">{data.clientName}</p>
                            </div>

                            {/* Date/Ref */}
                            <div className="col-span-4 row-span-2 col-start-5 row-start-4">
                                <p className="text-sm font-bold uppercase tracking-wide mb-2 text-gray-500">Doc Details</p>
                                <div className="space-y-1">
                                    <p className="font-mono text-black text-sm">DATE: {data.date}</p>
                                    <p className="font-mono text-black text-sm">REF: {data.refNumber}</p>
                                    <p className="font-mono text-black text-sm uppercase">EXP: {data.validUntil}</p>
                                </div>
                            </div>

                            {/* Logo Area */}
                            <div className="col-span-4 row-span-1 col-start-9 row-start-6 flex justify-end items-end">
                                {data.logo ? (
                                    <img src={data.logo} className="h-16 w-auto grayscale opacity-80" alt="Logo" />
                                ) : (
                                    <span className="text-2xl font-bold tracking-tight">HIGH POINT</span>
                                )}
                            </div>
                        </div>
                    </div>
                </Page>
            );
        }

        // 11. DARK MODE
        if (data.coverStyle === 'dark-mode') {
            return (
                <Page isCover>
                    <div className="flex-1 flex flex-col p-20 bg-slate-950 text-white relative overflow-hidden">
                        {/* Glow effects */}
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] opacity-20" style={{ backgroundColor: color }}></div>
                        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-[100px] opacity-10" style={{ backgroundColor: color }}></div>

                        <div className="relative z-10 flex justify-between items-start mb-12">
                            <div className="mb-12">
                                {data.logo ? (
                                    <img src={data.logo} className="h-16 w-auto brightness-0 invert opacity-90" alt="Logo" />
                                ) : (
                                    <span className="text-2xl font-bold tracking-tight">HIGH POINT</span>
                                )}
                            </div>
                            {data.clientLogo && <img src={data.clientLogo} className="h-12 w-auto brightness-0 invert opacity-30" alt="Client Logo" />}
                        </div>

                        <div className="relative z-10 flex-1 flex flex-col justify-center">
                            <div className="border-l-2 pl-8" style={{ borderColor: color }}>
                                <span className="text-violet-400 font-mono text-sm tracking-widest uppercase mb-4 block">
                                  // Project Proposal // V{data.version}.0 // {typeInfo.label}
                                </span>
                                <h1 className="text-6xl font-bold mb-6 leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                                    {data.title}
                                </h1>
                                <p className="text-2xl text-gray-400 font-light italic">
                                    Prepared for <span className="text-white font-medium">{data.clientCompany}</span>
                                </p>
                            </div>
                        </div>

                        <div className="relative z-10 grid grid-cols-3 border-t border-slate-800 pt-8 mt-auto">
                            <div>
                                <span className="text-slate-500 text-xs uppercase tracking-wider block mb-1">Issue Date</span>
                                <span className="font-mono text-sm">{data.date}</span>
                            </div>
                            <div>
                                <span className="text-slate-500 text-xs uppercase tracking-wider block mb-1">Expiration</span>
                                <span className="font-mono text-sm">{data.validUntil}</span>
                            </div>
                            <div className="text-right">
                                <span className="text-slate-500 text-xs uppercase tracking-wider block mb-1">Trace ID</span>
                                <span className="font-mono text-sm text-violet-400">{data.refNumber}</span>
                            </div>
                        </div>
                    </div>
                </Page>
            );
        }

        // 12. ARCHITECTURAL
        if (data.coverStyle === 'architectural') {
            return (
                <Page isCover>
                    <div className="flex-1 flex flex-col p-12 bg-[#fffdf5] text-slate-800 relative h-full">
                        {/* Graph paper background */}
                        <div className="absolute inset-0 opacity-10 pointer-events-none"
                            style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                        </div>

                        {/* Content Frame */}
                        <div className="border-4 border-slate-800 h-full p-8 flex flex-col justify-between relative z-10 bg-white/50 backdrop-blur-sm">
                            <div className="flex justify-between items-start border-b-2 border-slate-800 pb-8">
                                <div>
                                    <h1 className="text-4xl font-bold uppercase tracking-wider mb-2">{data.title}</h1>
                                    <p className="font-mono text-sm uppercase tracking-widest text-slate-500">Project Spec // {data.refNumber} // {typeInfo.label}</p>
                                </div>
                                <div className="text-right flex flex-col items-end gap-2">
                                    {data.logo ? <img src={data.logo} className="h-12 w-auto grayscale" alt="Logo" /> : <div className="font-bold text-xl tracking-tighter">HP.TECH</div>}
                                    <div className="text-[10px] font-bold border-t border-slate-800 pt-1">REVISION v{data.version}.0</div>
                                </div>
                            </div>

                            <div className="flex-1 flex items-center justify-center">
                                <div className="border-2 border-dashed border-slate-400 p-12 w-full max-w-2xl text-center bg-white">
                                    <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400 mb-6">Prepared For Client</p>
                                    <h2 className="text-5xl font-light mb-4">{data.clientCompany}</h2>
                                    <p className="text-xl text-slate-600 italic">{data.clientName}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-4 border-t-2 border-slate-800 pt-4 text-center font-mono text-xs">
                                <div className="border-r border-slate-300">
                                    <span className="block text-slate-400 mb-1">DATE</span>
                                    <span className="font-bold">{data.date}</span>
                                </div>
                                <div className="border-r border-slate-300">
                                    <span className="block text-slate-400 mb-1">VERSION</span>
                                    <span className="font-bold">v{data.version}.0</span>
                                </div>
                                <div className="border-r border-slate-300">
                                    <span className="block text-slate-400 mb-1">STATUS</span>
                                    <span className="font-bold uppercase">{data.status}</span>
                                </div>
                                <div>
                                    <span className="block text-slate-400 mb-1">AUTH</span>
                                    <span className="font-bold">HIGH POINT</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </Page>
            );
        }

        // 13. ABSTRACT
        if (data.coverStyle === 'abstract') {
            return (
                <Page isCover>
                    <div className="flex-1 relative overflow-hidden bg-white p-20 flex flex-col justify-center h-full">
                        {/* Abstract Blobs */}
                        <div className="absolute top-[-10%] right-[-15%] w-[800px] h-[800px] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" style={{ backgroundColor: '#e0e7ff' }}></div>
                        <div className="absolute bottom-[-10%] left-[-15%] w-[600px] h-[600px] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" style={{ backgroundColor: `${color}40` }}></div>
                        <div className="absolute top-[40%] left-[40%] w-[400px] h-[400px] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" style={{ backgroundColor: '#fce7f3' }}></div>

                        <div className="relative z-10 text-center">
                            <div className="flex justify-between items-start mb-16 px-12">
                                {data.logo ? <img src={data.logo} className="h-16 w-auto object-contain" alt="Logo" /> : <span className="text-3xl font-bold tracking-tighter">HP.</span>}
                                {data.clientLogo && <img src={data.clientLogo} className="h-12 w-auto opacity-20 grayscale shadow-sm" alt="Client Logo" />}
                            </div>

                            <span className="inline-block py-1 px-3 rounded-full bg-gray-100 text-gray-800 text-xs font-bold uppercase tracking-widest mb-8">
                                <span className="opacity-50">PROPOSAL //</span> <span style={{ color: color }}>{typeInfo.label}</span>
                            </span>

                            <h1 className="text-6xl md:text-7xl font-light text-gray-900 mb-8 leading-tight tracking-tight px-12 break-words">
                                {data.title}
                            </h1>

                            <div className="w-16 h-1 bg-gray-900 mx-auto mb-12 rounded-full"></div>

                            <p className="text-xl text-gray-500 font-light mb-16">
                                Prepared exclusively for <strong className="text-gray-900 font-medium">{data.clientCompany}</strong>
                            </p>

                            <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto border-t border-gray-100 pt-12">
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Issue Date</p>
                                    <p className="text-sm font-medium">{data.date}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Version</p>
                                    <p className="text-sm font-medium">v{data.version}.0</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Reference</p>
                                    <p className="text-sm font-mono text-gray-400 uppercase">{data.refNumber}</p>
                                </div>
                            </div>
                        </div>

                        <div className="absolute bottom-12 left-0 w-full text-center flex flex-col items-center gap-2">
                            <p className="text-[10px] text-gray-300 uppercase tracking-[0.5em]">High Point Technology Strategic Asset</p>
                            <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></div>
                        </div>
                    </div>
                </Page>
            );
        }

        // 14. NEON NIGHT (New)
        if (data.coverStyle === 'neon-night') {
            return (
                <Page isCover>
                    <div className="flex-1 flex flex-col p-16 bg-black text-white relative overflow-hidden h-full">
                        {/* Neon Elements */}
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-cyan-400 via-pink-500 to-yellow-500"></div>
                        <div className="absolute bottom-0 right-0 w-2/3 h-1 bg-gradient-to-l from-cyan-400 to-transparent"></div>

                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border blur-sm" style={{ borderColor: `${color}30` }}></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[580px] h-[580px] rounded-full border blur-sm" style={{ borderColor: `${color}20` }}></div>

                        <div className="relative z-10 flex justify-between items-start mb-24">
                            {data.logo ? <img src={data.logo} className="h-10 w-auto brightness-0 invert shadow-[0_0_15px_rgba(255,255,255,0.2)]" alt="Logo" /> : <div className="font-bold text-2xl tracking-tighter shadow-cyan-400/50">HP.NEON</div>}
                            <div className="flex items-center gap-6">
                                {data.clientLogo && <img src={data.clientLogo} className="h-10 w-auto brightness-0 invert opacity-40 shadow-[0_0_10px_rgba(255,255,255,0.1)]" alt="Client Logo" />}
                                <div className="px-3 py-1 border border-cyan-400 rounded-full text-cyan-400 text-[10px] font-bold tracking-widest uppercase shadow-[0_0_10px_rgba(34,211,238,0.3)]"> Confidential</div>
                            </div>
                        </div>

                        <div className="relative z-10 flex-1 flex flex-col justify-center items-start">
                            <h1 className="text-7xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500" style={{ textShadow: `0 0 30px ${color}` }}>
                                {data.title}
                            </h1>
                            <div className="flex items-center gap-4 mb-8">
                                <div className="h-1 w-32 shadow-[0_0_15px_rgba(236,72,153,0.8)]" style={{ backgroundColor: color }}></div>
                                <span className="text-xs font-bold tracking-widest uppercase border px-2 py-0.5 rounded shadow-[0_0_8px_rgba(34,211,238,0.5)]" style={{ color: color, borderColor: color }}>
                                    {typeInfo.label} V{data.version}.0
                                </span>
                            </div>

                            <p className="text-xl text-gray-400 font-light italic">
                                Prepared for <span className="text-white font-bold tracking-tight">{data.clientCompany}</span>
                            </p>
                            <p className="text-sm text-gray-500 font-light mt-1">{data.clientName}</p>
                        </div>

                        <div className="relative z-10 flex justify-between items-end mt-auto border-t border-white/10 pt-8">
                            <div className="grid grid-cols-2 gap-12 text-xs font-mono">
                                <div>
                                    <p className="mb-1 text-cyan-400 font-bold opacity-80 uppercase tracking-tighter">Issue_Date</p>
                                    <p className="text-white">{data.date}</p>
                                </div>
                                <div>
                                    <p className="mb-1 text-pink-500 font-bold opacity-80 uppercase tracking-tighter">Ref_Code</p>
                                    <p className="text-white uppercase">{data.refNumber}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-gray-600 font-mono uppercase">© {new Date().getFullYear()} High Point Technology</p>
                                <p className="text-[10px] text-gray-700 font-mono">Valid_Till: {data.validUntil}</p>
                            </div>
                        </div>
                    </div>
                </Page>
            );
        }

        // 15. BRUTALIST (New)
        if (data.coverStyle === 'brutalist') {
            return (
                <Page isCover>
                    <div className="flex-1 flex flex-col bg-[#e5e5e5] p-8 border-[16px] border-black h-full">
                        <div className="flex-1 border-4 border-black p-8 flex flex-col justify-between relative bg-white h-full relative overflow-hidden">
                            <div className="absolute top-8 right-8 bg-black text-white px-4 py-2 text-2xl font-bold transform rotate-2 z-20">
                                {typeInfo.label.toUpperCase()} PROPOSAL V{data.version}.0
                            </div>

                            <div className="flex justify-between items-start border-b-4 border-black pb-8 relative z-10">
                                {data.logo ? <img src={data.logo} className="h-16 grayscale contrast-200" alt="Logo" /> : <h2 className="text-4xl font-black uppercase tracking-tighter">High Point</h2>}
                                {data.clientLogo && <img src={data.clientLogo} className="h-16 w-auto grayscale contrast-200 opacity-80" alt="Client Logo" />}
                            </div>

                            <div className="my-12 relative z-10">
                                <h1 className="text-8xl font-black uppercase leading-[0.85] tracking-tighter text-black break-words mb-4">
                                    {data.title}
                                </h1>
                                <div className="h-8 w-2/3 bg-black flex items-center px-4">
                                    <p className="text-white text-xs font-bold uppercase tracking-widest italic">Confidential High-Resolution Asset</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 border-t-4 border-black relative z-10 bg-white">
                                <div className="border-r-4 border-black p-6">
                                    <p className="font-bold text-xs uppercase mb-2 text-gray-500">CLIENT_ID</p>
                                    <p className="text-3xl font-black uppercase leading-tight">{data.clientCompany}</p>
                                    <p className="text-lg font-bold border-t border-black mt-2 pt-1">{data.clientName}</p>
                                </div>
                                <div className="p-6 flex flex-col justify-between">
                                    <div className="space-y-4">
                                        <div>
                                            <p className="font-bold text-xs uppercase mb-1 text-gray-500">TIMESTAMP</p>
                                            <p className="text-xl font-black">{data.date}</p>
                                        </div>
                                        <div>
                                            <p className="font-bold text-xs uppercase mb-1 text-gray-500">VALID_UNTIL</p>
                                            <p className="text-xl font-black">{data.validUntil}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-black text-white p-4 font-mono text-center text-sm uppercase tracking-widest mt-auto relative z-10 flex justify-between items-center px-8">
                                <span>REF: {data.refNumber}</span>
                                <span className="text-[10px] opacity-50">© {new Date().getFullYear()} HP.CORP</span>
                            </div>
                        </div>
                    </div>
                </Page>
            );
        }

        // 16. NATURE (New)
        if (data.coverStyle === 'nature') {
            return (
                <Page isCover>
                    <div className="flex-1 flex flex-col bg-[#fdfcf0] p-16 relative overflow-hidden h-full">
                        {/* Organic shapes */}
                        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#e8eed9] rounded-bl-[300px] z-0"></div>
                        <div className="absolute bottom-0 left-0 w-[500px] h-[400px] bg-[#dce3c8] rounded-tr-[200px] z-0"></div>

                        <div className="relative z-10 flex justify-between items-center mb-24">
                            {data.logo ? <img src={data.logo} className="h-12 w-auto opacity-80" alt="Logo" /> : <span className="font-serif text-2xl text-[#4a5d23] tracking-tighter">High Point</span>}
                            {data.clientLogo && <img src={data.clientLogo} className="h-12 w-auto opacity-30 grayscale sepia" alt="Client Logo" />}
                        </div>

                        <div className="relative z-10 max-w-2xl">
                            <span className="text-[#8c9e5e] font-serif italic text-xl mb-4 block">A Strategic Proposal for {data.clientCompany}</span>
                            <h1 className="text-6xl font-serif text-[#2c3e10] leading-tight mb-8">
                                {data.title}
                            </h1>
                            <div className="flex items-center gap-4 mb-12">
                                <div className="h-px w-24 bg-[#8c9e5e]"></div>
                                <span className="text-[#8c9e5e] font-serif italic text-lg">{typeInfo.label} Edition // v{data.version}.0</span>
                            </div>

                            <div className="bg-white/40 backdrop-blur-sm border border-[#8c9e5e]/20 p-8 inline-block rounded-2xl">
                                <p className="text-sm text-[#4a5d23] font-serif italic mb-2">Primary Contact</p>
                                <p className="text-xl font-serif text-[#2c3e10] mb-1">{data.clientName}</p>
                                <p className="text-[#5f6f3e] text-sm opacity-70">{data.clientEmail}</p>
                            </div>
                        </div>

                        <div className="relative z-10 mt-auto flex justify-between items-end text-[#5f6f3e] font-serif border-t border-[#8c9e5e]/20 pt-8">
                            <div className="flex gap-16">
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest mb-1 opacity-70">Published Date</p>
                                    <p className="text-lg font-medium">{data.date}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest mb-1 opacity-70">Valid Through</p>
                                    <p className="text-lg font-medium">{data.validUntil}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] uppercase tracking-widest mb-1 opacity-70">Doc ID</p>
                                <p className="text-lg font-mono font-bold">{data.refNumber}</p>
                            </div>
                        </div>
                    </div>
                </Page>
            );
        }

        // 17. JAPANESE MINIMAL (New)
        if (data.coverStyle === 'japanese-minimal') {
            return (
                <Page isCover>
                    <div className="flex-1 flex bg-[#f9f7f2] relative p-16 h-full">
                        {/* Vertical text layout simulation */}
                        <div className="absolute right-24 top-24 bottom-24 w-24 border-l flex flex-col justify-between items-center py-8" style={{ borderColor: `${color}30` }}>
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }}></div>
                            <span className="text-[10px] text-gray-400 uppercase tracking-[0.5em] vertical-rl rotate-180 font-light">
                                REF#{data.refNumber} • {data.date} • V{data.version}.0
                            </span>
                            <div className="w-1.5 h-1.5 rounded-full opacity-20" style={{ backgroundColor: color }}></div>
                        </div>

                        <div className="flex-1 flex flex-col justify-center items-center z-10 relative h-full">
                            <div className="w-32 h-32 rounded-full mb-16 shadow-2xl flex items-center justify-center" style={{ backgroundColor: color, boxShadow: `0 25px 50px -12px ${color}50` }}>
                                <div className="w-16 h-px bg-white/20 rotate-45"></div>
                            </div>

                            <div className="text-center max-w-lg">
                                <div className="flex flex-col items-center mb-12">
                                    <span className="text-[10px] text-red-600 font-bold tracking-[0.4em] uppercase mb-4">{typeInfo.fullLabel}</span>
                                    <div className="h-px w-8 bg-gray-200"></div>
                                </div>

                                <h1 className="text-5xl font-light text-gray-900 mb-12 leading-snug tracking-wide break-words italic">
                                    {data.title}
                                </h1>

                                <div className="space-y-4 pt-12 border-t border-gray-100 w-full">
                                    <p className="text-[10px] text-gray-400 uppercase tracking-[0.25em] mb-2">Prepared Exclusively For</p>
                                    <p className="text-2xl font-serif text-gray-800 tracking-tight">{data.clientCompany}</p>
                                    <p className="text-sm text-gray-500 font-light">{data.clientName}</p>
                                </div>
                            </div>
                        </div>

                        <div className="absolute top-16 left-16 flex flex-col gap-4">
                            {data.logo ? <img src={data.logo} className="h-12 w-auto opacity-40 grayscale" alt="Logo" /> : <div className="w-12 h-12 border border-gray-300 rounded-sm"></div>}
                            {data.clientLogo && <img src={data.clientLogo} className="h-10 w-auto opacity-20 grayscale sepia" alt="Client Logo" />}
                        </div>

                        <div className="absolute bottom-16 left-16">
                            <p className="text-[10px] text-gray-300 uppercase tracking-[0.2em] font-light">Valid Through: {data.validUntil}</p>
                        </div>
                    </div>
                </Page>
            );
        }

        // 18. RETRO POP (New)
        if (data.coverStyle === 'retro-pop') {
            return (
                <Page isCover>
                    <div className="flex-1 flex flex-col bg-yellow-300 p-12 relative overflow-hidden h-full">
                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #000 2px, transparent 2.5px)', backgroundSize: '20px 20px' }}></div>

                        {/* Shapes */}
                        <div className="absolute top-20 right-[-50px] w-64 h-64 bg-pink-500 rounded-full border-4 border-black"></div>
                        <div className="absolute bottom-20 left-[-50px] w-0 h-0 border-l-[100px] border-l-transparent border-t-[150px] border-t-blue-600 border-r-[100px] border-r-transparent transform rotate-45"></div>
                        <div className="absolute bottom-40 right-20 w-32 h-32 bg-white border-4 border-black transform rotate-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"></div>

                        <div className="relative z-10 flex flex-col items-center mt-12 w-full">
                            <div className="flex justify-between items-start w-full mb-12 px-8">
                                {data.logo ? <img src={data.logo} className="h-10 w-auto contrast-150 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white border-2 border-black p-1" alt="Logo" /> : <div className="font-bold text-2xl tracking-tighter border-2 border-black p-1 bg-white">HP.</div>}
                                {data.clientLogo && <img src={data.clientLogo} className="h-10 w-auto contrast-125 grayscale shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white border-2 border-black p-1" alt="Client Logo" />}
                            </div>

                            <div className="bg-white border-4 border-black p-12 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] max-w-3xl mx-auto w-full">
                                <div className="mb-8 text-center bg-white inline-block mx-auto transform -rotate-2 border-2 border-black p-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                    <span className="bg-black text-white px-4 py-1 text-xl font-bold uppercase inline-block">{typeInfo.label} Proposal</span>
                                </div>

                                <h1 className="text-6xl font-black text-center text-black mb-8 leading-none uppercase italic break-words">
                                    {data.title}
                                </h1>

                                <div className="flex justify-center mb-8">
                                    <div className="h-4 w-full bg-blue-500 border-y-4 border-black"></div>
                                </div>

                                <div className="grid grid-cols-2 gap-8 text-center border-b-2 border-black pb-8 mb-8">
                                    <div>
                                        <p className="font-black text-xs uppercase mb-1">CLIENT_TARGET</p>
                                        <p className="text-xl font-bold">{data.clientCompany}</p>
                                    </div>
                                    <div>
                                        <p className="font-black text-xs uppercase mb-1">CONTACT_PERSON</p>
                                        <p className="text-xl font-bold">{data.clientName}</p>
                                    </div>
                                </div>

                                <div className="flex justify-around text-xs font-mono">
                                    <div><span className="font-black">DATE:</span> {data.date}</div>
                                    <div><span className="font-black">REF:</span> {data.refNumber}</div>
                                    <div><span className="font-black">VER:</span> v{data.version}.0</div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto relative z-10 flex justify-between font-black text-xl italic">
                            <div className="bg-white border-2 border-black px-4 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] uppercase">
                                High Point Technology
                            </div>
                            <div className="bg-white border-2 border-black px-4 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                {new Date().getFullYear()}
                            </div>
                        </div>
                    </div>
                </Page>
            );
        }

        // 19. FUTURISTIC GRID (New)
        if (data.coverStyle === 'futuristic-grid') {
            return (
                <Page isCover>
                    <div className="flex-1 flex flex-col bg-slate-900 text-cyan-400 p-12 relative font-mono h-full">
                        {/* Grid */}
                        <div className="absolute inset-0 opacity-20"
                            style={{
                                backgroundImage: `linear-gradient(${color}80 1px, transparent 1px), linear-gradient(90deg, ${color}80 1px, transparent 1px)`,
                                backgroundSize: '40px 40px'
                            }}>
                        </div>

                        {/* Interface Elements */}
                        <div className="absolute top-8 left-8 w-4 h-4 border-t-2 border-l-2 border-cyan-400"></div>
                        <div className="absolute top-8 right-8 w-4 h-4 border-t-2 border-r-2 border-cyan-400"></div>
                        <div className="absolute bottom-8 left-8 w-4 h-4 border-b-2 border-l-2 border-cyan-400"></div>
                        <div className="absolute bottom-8 right-8 w-4 h-4 border-b-2 border-r-2 border-cyan-400"></div>

                        <div className="relative z-10 flex justify-between items-center mb-24 border-b border-cyan-900 pb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-3 h-3 bg-cyan-400 animate-pulse"></div>
                                <span className="text-sm tracking-widest font-bold">SYSTEM_READY // VER_{data.version}.0</span>
                            </div>
                            <div className="flex items-center gap-6">
                                {data.clientLogo && <img src={data.clientLogo} className="h-8 w-auto brightness-0 invert opacity-40 grayscale" alt="Client Logo" />}
                                <div className="text-xs opacity-70">ID: {data.refNumber}</div>
                            </div>
                        </div>

                        <div className="relative z-10 max-w-4xl border-l-4 border-cyan-500 pl-8 py-8 bg-slate-800/80 backdrop-blur-md shadow-2xl shadow-cyan-900/20">
                            <p className="text-xs text-cyan-500 mb-2 uppercase tracking-[0.3em] font-bold italic">&gt;&gt;&gt; Project_File_Init // TYPE: {data.type}</p>
                            <h1 className="text-6xl font-black text-white mb-8 leading-tight tracking-tighter uppercase break-words" style={{ textShadow: '0 0 20px rgba(34,211,238,0.2)' }}>
                                {data.title}
                            </h1>
                            <div className="grid grid-cols-2 gap-12 text-sm border-t border-cyan-900 pt-8">
                                <div>
                                    <p className="text-cyan-600 text-[10px] mb-2 font-bold uppercase tracking-widest border-b border-cyan-900/30 pb-1">CLIENT_TARGET</p>
                                    <div className="space-y-1">
                                        <p className="text-white text-lg font-bold">{data.clientCompany}</p>
                                        <p className="text-cyan-200 opacity-60 italic">{data.clientName}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col justify-between">
                                    <div>
                                        <p className="text-cyan-600 text-[10px] mb-2 font-bold uppercase tracking-widest border-b border-cyan-900/30 pb-1">TIMELINE_META</p>
                                        <p className="text-white">ISSUED: {data.date}</p>
                                        <p className="text-cyan-200 opacity-60">EXPIRES: {data.validUntil}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto relative z-10">
                            <div className="w-full h-px bg-cyan-900 mb-4 shadow-[0_0_10px_rgba(34,211,238,0.3)]"></div>
                            <div className="flex justify-between items-center text-[10px] text-cyan-600 font-bold tracking-widest uppercase">
                                <div className="flex items-center gap-4">
                                    {data.logo ? <img src={data.logo} className="h-4 w-auto brightness-0 invert opacity-50" alt="Logo" /> : <span>HIGH POINT TECHNOLOGY</span>}
                                    <span className="opacity-30">//</span>
                                    <span>SECURE_TRANSMISSION_PROTOCOL</span>
                                </div>
                                <span>[ STATUS: PENDING_APPROVAL ]</span>
                            </div>
                        </div>
                    </div>
                </Page>
            );
        }

        // 20. ETHEREAL (Nature but Purple/Soft)
        if (data.coverStyle === 'ethereal') {
            return (
                <Page isCover>
                    <div className="flex-1 flex flex-col bg-[#fdfaff] p-16 relative overflow-hidden h-full">
                        {/* Organic shapes with Purple/Violet Gradients */}
                        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-bl-[300px] z-0 opacity-60"
                            style={{ background: `linear-gradient(135deg, ${color}10 0%, ${color}40 100%)` }}></div>
                        <div className="absolute bottom-0 left-0 w-[500px] h-[400px] rounded-tr-[200px] z-0 opacity-40"
                            style={{ background: `linear-gradient(45deg, ${color}30 0%, ${color}05 100%)` }}></div>

                        <div className="relative z-10 flex justify-between items-center mb-24 px-4">
                            {data.logo ? <img src={data.logo} className="h-10 w-auto opacity-70" alt="Logo" /> : <span className="font-serif text-2xl" style={{ color: color }}>High Point</span>}
                            {data.clientLogo && <img src={data.clientLogo} className="h-12 w-auto opacity-20 grayscale shadow-sm" alt="Client Logo" />}
                        </div>

                        <div className="relative z-10 max-w-2xl px-4">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="w-8 h-px bg-violet-200"></div>
                                <span className="font-serif italic text-lg" style={{ color: `${color}cc` }}>A Strategic Proposal for <span className="font-bold underline decoration-violet-100 underline-offset-4">{data.clientCompany}</span></span>
                            </div>

                            <h1 className="text-6xl font-serif leading-tight mb-8 break-words" style={{ color: '#2e1065' }}>
                                {data.title}
                            </h1>

                            <div className="flex items-center gap-4 mb-20">
                                <div className="h-px w-24" style={{ backgroundColor: color }}></div>
                                <span className="font-serif italic text-lg opacity-60" style={{ color: color }}>{typeInfo.label} Edition // v{data.version}.0</span>
                            </div>

                            <div className="grid grid-cols-2 gap-12 border-t border-violet-100 pt-12">
                                <div>
                                    <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-violet-300 mb-2">Primary Contact</p>
                                    <p className="font-serif text-xl" style={{ color: '#4c1d95' }}>{data.clientName}</p>
                                    <p className="text-sm opacity-50 italic mt-1" style={{ color: color }}>{data.clientEmail}</p>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-violet-300 mb-2">Doc_Identity</p>
                                    <p className="font-mono text-sm mb-1" style={{ color: color }}>REF: {data.refNumber}</p>
                                    <p className="text-[10px] opacity-40 uppercase tracking-widest">Valid Until: {data.validUntil}</p>
                                </div>
                            </div>
                        </div>

                        <div className="relative z-10 mt-auto flex justify-between items-center font-serif px-4 border-t border-violet-50/50 pt-8" style={{ color: '#4c1d95' }}>
                            <p className="text-xs italic opacity-50">Confidential Statement for Authorized Recipients Only</p>
                            <p className="text-sm font-medium tracking-widest uppercase">{data.date}</p>
                        </div>
                    </div>
                </Page>
            );
        }

        // 21. AURORA (Nature but Dark Purple/Gradient)
        if (data.coverStyle === 'aurora') {
            return (
                <Page isCover>
                    <div className="flex-1 flex flex-col p-16 relative overflow-hidden text-white bg-slate-900 h-full">
                        {/* Deep Gradient Background */}
                        <div className="absolute inset-0 z-0 bg-gradient-to-br from-violet-900 via-purple-900 to-slate-900"></div>

                        {/* Aurora-like Waves */}
                        <div className="absolute bottom-0 left-0 w-full h-[60%] z-0 opacity-40"
                            style={{ background: 'linear-gradient(to top right, #c084fc, transparent)' }}></div>
                        <div className="absolute top-0 right-0 w-[80%] h-[80%] rounded-full blur-3xl opacity-20 bg-fuchsia-500"></div>

                        <div className="relative z-10 flex justify-between items-center mb-24">
                            {data.logo ? <img src={data.logo} className="h-12 w-auto brightness-0 invert opacity-90" alt="Logo" /> : <span className="font-light tracking-wider text-2xl">High Point</span>}
                            {data.clientLogo && <img src={data.clientLogo} className="h-12 w-auto brightness-0 invert opacity-30 shadow-2xl" alt="Client Logo" />}
                        </div>

                        <div className="relative z-10 max-w-3xl flex-1 flex flex-col justify-center">
                            <div className="inline-block self-start px-4 py-1 mb-10 rounded-full border border-violet-400/30 bg-violet-500/10 backdrop-blur-md text-xs font-medium tracking-widest uppercase text-violet-200">
                                {typeInfo.label} PROPOSAL // V{data.version}.0
                            </div>
                            <h1 className="text-7xl font-bold leading-[1.1] mb-8 text-transparent bg-clip-text bg-gradient-to-r from-white via-violet-100 to-violet-300 break-words drop-shadow-sm">
                                {data.title}
                            </h1>
                            <div className="space-y-2 mb-12">
                                <p className="text-2xl font-light text-violet-200 italic">
                                    Prepared for <span className="font-bold border-b-2 border-violet-500/50 pb-1 tracking-tight">{data.clientCompany}</span>
                                </p>
                                <p className="text-violet-300/60 font-medium tracking-wide">{data.clientName} // {data.clientEmail}</p>
                            </div>
                        </div>

                        <div className="relative z-10 flex justify-between items-end border-t border-white/10 pt-10 mt-auto">
                            <div className="flex gap-16">
                                <div>
                                    <p className="text-[10px] uppercase tracking-[0.3em] text-violet-400 font-bold mb-2">Issue Date</p>
                                    <p className="text-xl font-light">{data.date}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-[0.3em] text-violet-400 font-bold mb-2">Trace ID</p>
                                    <p className="text-xl font-mono font-bold tracking-tighter uppercase">{data.refNumber}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] opacity-40 uppercase tracking-widest italic">Confidential High Point Asset © {new Date().getFullYear()}</p>
                                <p className="text-xs text-violet-400/80 font-mono mt-1 uppercase">Valid Through: {data.validUntil}</p>
                            </div>
                        </div>
                    </div>
                </Page>
            );
        }
        // 22. MIDNIGHT GRADIENT
        if (data.coverStyle === 'midnight-gradient') {
            return (
                <Page isCover>
                    <div className="flex-1 flex flex-col p-16 relative text-white bg-black h-full overflow-hidden">
                        {/* Deep Gradient Background */}
                        <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a] via-[#1e1b4b] to-black z-0"></div>
                        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] z-0"></div>
                        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-violet-600/20 rounded-full blur-[100px] z-0"></div>

                        <div className="relative z-10 flex-1 flex flex-col justify-center items-center text-center h-full">
                            <div className="mb-8 w-24 h-24 rounded-full border border-white/10 flex items-center justify-center backdrop-blur-md shadow-2xl">
                                {data.logo ? <img src={data.logo} className="h-12 w-auto brightness-0 invert" alt="Logo" /> : <Hexagon size={48} className="text-violet-400" />}
                            </div>
                            <h1 className="text-6xl font-bold mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-200 via-violet-200 to-pink-200">
                                {data.title}
                            </h1>
                            <div className="inline-block mb-6">
                                <span className="text-sm font-bold uppercase tracking-widest text-violet-300 border border-violet-500/30 px-4 py-1 rounded">
                                    {typeInfo.label} Proposal
                                </span>
                            </div>
                            <p className="text-xl text-slate-400 font-light max-w-xl mx-auto">
                                Prepared exclusively for {data.clientCompany}
                            </p>
                        </div>

                        <div className="relative z-10 mt-auto flex justify-between text-xs text-slate-500 font-mono">
                            <div>PROJECT_ID: {data.refNumber}</div>
                            <div>DATE: {data.date}</div>
                        </div>
                    </div>
                </Page>
            );
        }
        // 23. ART DECO
        if (data.coverStyle === 'art-deco') {
            return (
                <Page isCover>
                    <div className="flex-1 bg-[#1a1a1a] p-8 border-8 border-[#1a1a1a] h-full">
                        <div className="h-full border-4 border-[#D4AF37] relative flex flex-col items-center justify-center p-12 text-[#D4AF37]">
                            {/* Corner patterns */}
                            <div className="absolute top-4 left-4 w-16 h-16 border-t-2 border-l-2 border-[#D4AF37]"></div>
                            <div className="absolute top-4 right-4 w-16 h-16 border-t-2 border-r-2 border-[#D4AF37]"></div>
                            <div className="absolute bottom-4 left-4 w-16 h-16 border-b-2 border-l-2 border-[#D4AF37]"></div>
                            <div className="absolute bottom-4 right-4 w-16 h-16 border-b-2 border-r-2 border-[#D4AF37]"></div>

                            <div className="mb-12 flex flex-col items-center gap-4">
                                {data.logo ? (
                                    <img src={data.logo} className="h-20 w-auto brightness-0 sepia-[100%] hue-rotate-[5deg] saturate-[400%]" alt="Logo" />
                                ) : (
                                    <div className="text-3xl font-serif tracking-[0.2em] border-b border-[#D4AF37] pb-2">HIGH POINT</div>
                                )}
                                {data.clientLogo && <img src={data.clientLogo} className="h-10 w-auto grayscale brightness-0 sepia-[100%] opacity-40" alt="Client Logo" />}
                            </div>

                            <div className="w-full flex flex-col items-center text-center">
                                <span className="text-xs font-bold uppercase tracking-[0.4em] mb-8 opacity-60 italic border-y border-[#D4AF37]/30 py-1">
                                    {typeInfo.fullLabel} PROPOSAL // v{data.version}.0
                                </span>

                                <h1 className="text-6xl font-serif uppercase tracking-[0.1em] leading-tight mb-12 max-w-2xl break-words decoration-double underline underline-offset-8 decoration-[#D4AF37]/30">
                                    {data.title}
                                </h1>

                                <div className="w-24 h-24 border-2 border-[#D4AF37] rotate-45 flex items-center justify-center mb-12 shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                                    <div className="w-16 h-16 border border-[#D4AF37] flex items-center justify-center transform -rotate-45">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-center leading-tight">PRECISION<br />ASSET</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <p className="text-xl font-light uppercase tracking-[0.2em]">Prepared For <span className="font-bold">{data.clientCompany}</span></p>
                                    <p className="text-sm tracking-widest opacity-70 italic">{data.clientName}</p>
                                </div>
                            </div>

                            <div className="absolute bottom-12 left-12 text-[10px] font-mono tracking-widest opacity-60">
                                EST. {new Date().getFullYear()}
                            </div>
                            <div className="absolute bottom-12 right-12 text-[10px] font-mono tracking-widest text-right">
                                <p>REF_{data.refNumber}</p>
                                <p className="opacity-40">DATE_{data.date}</p>
                            </div>
                        </div>
                    </div>
                </Page>
            );
        }

        // 24. NEWSPAPER
        if (data.coverStyle === 'newspaper') {
            return (
                <Page isCover>
                    <div className="flex-1 bg-[#fdfdfd] p-12 flex flex-col text-black font-serif h-full relative overflow-hidden">
                        {/* Aging effect */}
                        <div className="absolute inset-0 bg-[#f4ece0] opacity-30 pointer-events-none"></div>

                        <div className="border-b-4 border-black pb-4 mb-4 flex justify-between items-end relative z-10">
                            <div>
                                <h2 className="text-6xl font-black uppercase tracking-tighter leading-none mb-1">THE HIGH POINT GAZETTE</h2>
                                <p className="text-xs font-bold tracking-[0.3em] uppercase opacity-70 italic">World-Class Solutions & Strategic Intelligence</p>
                            </div>
                            <div className="text-right text-sm border-l-2 border-black pl-4">
                                <p className="font-black">VOL. {data.version}.0</p>
                                <p className="font-bold border-t border-black mt-1 pt-1">{data.date}</p>
                            </div>
                        </div>

                        <div className="border-b border-black py-2 mb-8 flex justify-between text-xs font-bold uppercase tracking-widest relative z-10 bg-white/50 backdrop-blur-sm px-2">
                            <span>{typeInfo.label} SPECIAL EDITION</span>
                            <span className="animate-pulse text-red-700">● EXCLUSIVE DOSSIER</span>
                            <span>PRICE: CONFIDENTIAL</span>
                        </div>

                        <div className="flex-1 flex gap-8 relative z-10 h-full">
                            <div className="flex-[2.5] border-r-2 border-black pr-8 flex flex-col justify-between">
                                <div>
                                    <h1 className="text-7xl font-black leading-[0.9] mb-8 uppercase tracking-tighter decoration-4 underline-offset-8 underline decoration-black break-words">
                                        {data.title}
                                    </h1>
                                    <p className="text-2xl leading-tight mb-8 italic font-medium">
                                        Innovative strategic framework proposed for <span className="font-bold uppercase bg-black text-white px-2 py-0.5">{data.clientCompany}</span> by the High Point Technology advisory team.
                                    </p>
                                    <div className="grid grid-cols-2 gap-8 text-sm leading-snug border-t border-black/10 pt-4">
                                        <p className="first-letter:text-4xl first-letter:font-black first-letter:float-left first-letter:mr-2">
                                            This comprehensive proposal outlines the technical architecture and financial considerations tailored specifically for the unique challenges faced by {data.clientName}'s organization.
                                        </p>
                                        <p>
                                            High Point Technology remains committed to delivering unparalleled excellence. Reference document {data.refNumber} serves as the official record for this submission, valid until {data.validUntil}.
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-8 pt-4 border-t-4 border-black border-double flex justify-between font-mono text-[10px] items-center">
                                    <span>REF_CODE: {data.refNumber}</span>
                                    <span className="font-bold uppercase tracking-tighter">Certified Document // {new Date().getFullYear()}</span>
                                </div>
                            </div>
                            <div className="flex-1 flex flex-col h-full">
                                <div className="bg-black text-white p-6 mb-6 shadow-lg shadow-black/20">
                                    <h3 className="text-xl font-bold mb-4 uppercase tracking-tighter border-b border-white/30 pb-2">Executive Summary</h3>
                                    <p className="text-xs leading-relaxed opacity-90 italic">
                                        Comprehensive analysis and strategic roadmap for project {data.refNumber}. This dossier contains proprietary intelligence and trade secrets regarding the proposed {typeInfo.label} framework.
                                    </p>
                                </div>
                                <div className="flex-1 border-4 border-black p-4 flex flex-col items-center justify-center text-center bg-white shadow-xl rotate-[-2deg] mb-8">
                                    {data.logo ? <img src={data.logo} className="grayscale contrast-200 shadow-md mb-4" alt="Logo" /> : <div className="text-2xl font-black italic border-2 border-black p-2">HP TECH</div>}
                                    {data.clientLogo && (
                                        <div className="mt-4 pt-4 border-t border-black/10 w-full opacity-40">
                                            <img src={data.clientLogo} className="grayscale contrast-150 mx-auto h-12 w-auto" alt="Client Logo" />
                                        </div>
                                    )}
                                </div>
                                <div className="border-t border-black pt-2 text-[10px] font-bold uppercase tracking-tighter italic text-right opacity-50">
                                    High Point © Worldwide
                                </div>
                            </div>
                        </div>
                    </div>
                </Page>
            );
        }
        // 25. TERMINAL
        if (data.coverStyle === 'terminal') {
            return (
                <Page isCover>
                    <div className="flex-1 bg-black p-16 font-mono text-green-500 flex flex-col relative h-full overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20 bg-[linear-gradient(rgba(18,255,0,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,6px_100%] z-20"></div>

                        <div className="mb-12 relative z-10 flex justify-between items-start">
                            <div className="text-xs">
                                <p className="animate-pulse mb-1">&gt; INITIALIZING_SECURE_HANDSHAKE...</p>
                                <p>&gt; DETECTED_TYPE: "{data.type || 'RAW_SYSTEM'}"</p>
                                <p>&gt; CLIENT_AUTH: "{data.clientCompany.toUpperCase().replace(/\s+/g, '_')}"</p>
                                <p>&gt; ENCRYPT_V: "HP-AES-256-GCM"</p>
                                <p className="text-white font-bold">&gt; STATUS: [ SUCCESSFUL ]</p>
                            </div>
                            <div className="text-right">
                                {data.logo ? <img src={data.logo} className="h-10 w-auto brightness-0 invert opacity-50" alt="Logo" /> : <div className="text-xl font-bold border-2 border-green-500 p-1">HP_ROOT</div>}
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col justify-center relative z-10">
                            <h1 className="text-6xl font-black mb-12 leading-tight tracking-tighter text-white break-words drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]">
                                <span className="text-green-700 mr-6 select-none">root@highpoint:~$</span>
                                {data.title}<span className="animate-caret inline-block w-4 h-12 bg-green-500 align-middle ml-2"></span>
                            </h1>

                            <div className="border-4 border-green-900 p-10 bg-green-950/20 backdrop-blur-sm max-w-2xl relative">
                                <div className="absolute top-0 right-0 bg-green-900 px-3 py-1 text-black text-[10px] font-bold">DATA_CLUSTER</div>
                                <div className="grid grid-cols-[120px_1fr] gap-6 text-sm">
                                    <div className="opacity-60">[ TARGET ]:</div>
                                    <div className="text-white font-bold">{data.clientCompany}</div>
                                    <div className="opacity-60">[ PERSON ]:</div>
                                    <div className="text-white">{data.clientName}</div>
                                    <div className="opacity-60">[ VALID ]:</div>
                                    <div className="text-red-400 font-bold">{data.validUntil}</div>
                                    <div className="opacity-60">[ VERSION ]:</div>
                                    <div className="text-green-300 font-mono">STABLE_v{data.version}.0-RELEASE</div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto relative z-10 flex justify-between items-end border-t border-green-900 pt-8">
                            <div className="flex gap-12 text-xs">
                                <div>
                                    <span className="block opacity-40 mb-1">timestamp</span>
                                    <span>{data.date}</span>
                                </div>
                                <div>
                                    <span className="block opacity-40 mb-1">fingerprint</span>
                                    <span className="uppercase text-[10px]">{data.refNumber}</span>
                                </div>
                            </div>
                            <div className="text-right text-[10px] opacity-30 select-none">
                                <p>© HIGH POINT TECHNOLOGY // ALL RIGHTS RESERVED</p>
                                <p>UNAUTHORIZED ACCESS IS STRICTLY PROHIBITED</p>
                            </div>
                        </div>
                    </div>
                </Page>
            );
        }

        // 26. BRUSH STROKE
        if (data.coverStyle === 'brush-stroke') {
            return (
                <Page isCover>
                    <div className="flex-1 bg-white p-16 flex flex-col justify-center relative overflow-hidden h-full">
                        {/* Simulated brush strokes */}
                        <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[40%] bg-blue-500/10 -rotate-6 transform origin-bottom-left"></div>
                        <div className="absolute bottom-[10%] right-[-10%] w-[120%] h-[30%] bg-pink-500/10 -rotate-3 transform origin-top-right"></div>

                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="mb-12 flex items-center gap-6">
                                {data.logo ? <img src={data.logo} className="h-16 w-auto" alt="Logo" /> : <div className="text-3xl font-bold text-gray-800">HP.</div>}
                                {data.clientLogo && <img src={data.clientLogo} className="h-14 w-auto grayscale contrast-125 opacity-40 shadow-sm" alt="Client Logo" />}
                            </div>

                            <div className="inline-block relative mb-12">
                                <div className="absolute inset-0 bg-yellow-200 -skew-x-12 transform scale-110 opacity-40"></div>
                                <h1 className="relative text-6xl font-black text-gray-900 leading-[1.1] px-6 break-words max-w-2xl">
                                    {data.title}
                                </h1>
                                <div className="absolute -bottom-6 right-0 bg-blue-600 text-white text-[10px] font-bold px-3 py-1.5 transform rotate-2 shadow-lg uppercase tracking-widest">
                                    {typeInfo.fullLabel} EDITION
                                </div>
                            </div>

                            <div className="space-y-4 mb-20">
                                <p className="text-2xl font-serif italic text-gray-600">
                                    A Proposal Curated for <span className="font-bold text-gray-900 not-italic border-b-2 border-pink-200">{data.clientCompany}</span>
                                </p>
                                <p className="text-gray-400 font-medium tracking-wide uppercase text-xs">{data.clientName} // v{data.version}.0</p>
                            </div>

                            <div className="flex gap-16 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 border-t border-gray-100 pt-8 w-full justify-center">
                                <div><span className="opacity-40 mr-2">ISSUE_DATE:</span> {data.date}</div>
                                <div><span className="opacity-40 mr-2">REF_CODE:</span> {data.refNumber}</div>
                                <div><span className="opacity-40 mr-2">VALID_THRU:</span> {data.validUntil}</div>
                            </div>
                        </div>

                        <div className="absolute bottom-8 left-0 right-0 flex justify-center opacity-20">
                            <p className="text-[10px] font-bold uppercase tracking-[0.5em]">High Point Technology • Studio Edition</p>
                        </div>
                    </div>
                </Page>
            );
        }

        // 27. MONDRIAN
        if (data.coverStyle === 'mondrian') {
            return (
                <Page isCover>
                    <div className="flex-1 bg-white border-[12px] border-black grid grid-cols-12 grid-rows-6 h-full overflow-hidden">
                        {/* Header Block */}
                        <div className="col-span-8 row-span-2 border-r-[12px] border-b-[12px] border-black p-10 flex flex-col justify-center bg-white">
                            <div className="flex items-center gap-4 mb-4">
                                {data.logo ? <img src={data.logo} className="h-8 w-auto grayscale contrast-200" alt="Logo" /> : <span className="text-sm font-black border-2 border-black p-1">HP.</span>}
                                <span className="text-[10px] font-bold uppercase tracking-[0.3em] bg-black text-white px-3 py-1">{typeInfo.label}</span>
                            </div>
                            <h1 className="text-6xl font-black leading-[0.9] uppercase break-words">{data.title}</h1>
                            <p className="mt-4 text-xs font-bold uppercase tracking-widest opacity-40">System Release v{data.version}.0</p>
                        </div>

                        {/* Red Block */}
                        <div className="col-span-4 row-span-2 bg-[#ff0000] border-b-[12px] border-black flex items-center justify-center p-4">
                            {data.clientLogo && <img src={data.clientLogo} className="w-full h-auto brightness-0 invert contrast-150 opacity-40" alt="Client Logo" />}
                        </div>

                        {/* Blue Block */}
                        <div className="col-span-3 row-span-3 bg-[#0000ff] border-r-[12px] border-b-[12px] border-black flex items-end p-6">
                            <div className="text-white font-black text-7xl leading-none opacity-20 select-none transform -rotate-90 origin-bottom-left whitespace-nowrap">STRATEGY</div>
                        </div>

                        {/* Client Info */}
                        <div className="col-span-9 row-span-2 border-b-[12px] border-black p-10 bg-white flex flex-col justify-center">
                            <p className="text-[10px] font-black uppercase mb-4 tracking-[0.4em] text-gray-400">PARTNER_SPECIFICATION</p>
                            <p className="text-4xl font-black uppercase leading-tight tracking-tighter mb-2">{data.clientCompany}</p>
                            <div className="flex gap-4 items-center">
                                <div className="h-1 w-12 bg-black"></div>
                                <p className="text-lg font-bold italic text-gray-500">{data.clientName}</p>
                            </div>
                        </div>

                        {/* Yellow Block */}
                        <div className="col-span-5 row-span-1 col-start-4 row-start-6 border-r-[12px] border-black bg-[#ffff00]"></div>

                        {/* Details */}
                        <div className="col-span-4 row-span-1 col-start-9 row-start-6 bg-white p-6 border-t-[12px] border-l-[12px] border-black -mt-[12px] -ml-[12px] flex flex-col justify-center">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase">
                                <span>ISSUE</span>
                                <span>{data.date}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-black uppercase mt-1">
                                <span>TRACE</span>
                                <span>{data.refNumber}</span>
                            </div>
                        </div>
                    </div>
                </Page>
            );
        }

        // 28. BLUEPRINT DARK
        if (data.coverStyle === 'blueprint-dark') {
            return (
                <Page isCover>
                    <div className="flex-1 bg-[#00509d] p-12 text-white relative font-mono h-full overflow-hidden">
                        {/* Grid */}
                        <div className="absolute inset-0 opacity-20 pointer-events-none z-0"
                            style={{
                                backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
                                backgroundSize: '20px 20px'
                            }}>
                        </div>

                        <div className="h-full border-[6px] border-white/80 p-10 flex flex-col justify-between relative z-10 bg-[#00509d]/10 backdrop-blur-[2px]">
                            <div className="border-b-4 border-white pb-10 flex justify-between items-start">
                                <div>
                                    {data.logo ? <img src={data.logo} className="h-16 w-auto brightness-0 invert" alt="Logo" /> : <h2 className="text-4xl font-bold tracking-tighter">HIGH POINT TECH</h2>}
                                    <p className="text-[10px] mt-2 font-bold tracking-[0.5em] opacity-60 uppercase">Engineering & Strategy Division</p>
                                </div>
                                {data.clientLogo && <img src={data.clientLogo} className="h-14 w-auto brightness-0 invert opacity-40 contrast-150" alt="Client Logo" />}
                            </div>

                            <div className="flex-1 flex flex-col justify-center py-12">
                                <p className="text-xs mb-6 px-3 py-1 bg-white text-[#00509d] inline-block self-start font-bold uppercase tracking-widest leading-none">
                                    PROJECT_SPECIFICATION // {(data.type || 'MIXED').toUpperCase()} // v{data.version}.0
                                </p>
                                <h1 className="text-7xl font-bold mb-8 uppercase leading-[0.9] tracking-tighter break-words decoration-4 underline underline-offset-8 decoration-white/20">
                                    {data.title}
                                </h1>
                                <div className="space-y-2 mt-4">
                                    <p className="text-sm opacity-50 uppercase tracking-widest font-bold">Primary Target Authority:</p>
                                    <p className="text-3xl font-bold border-l-8 border-white pl-6">{data.clientCompany}</p>
                                    <p className="text-lg opacity-70 italic pl-8">Attn: {data.clientName}</p>
                                </div>
                            </div>

                            <div className="border-t-4 border-white pt-10 grid grid-cols-4 gap-8 text-[10px] font-bold uppercase tracking-widest">
                                <div className="border-r border-white/30 pr-4">
                                    <span className="block opacity-50 mb-2">Issue_Date</span>
                                    <span className="text-lg">{data.date}</span>
                                </div>
                                <div className="border-r border-white/30 pr-4">
                                    <span className="block opacity-50 mb-2">Ref_Identity</span>
                                    <span className="text-lg font-mono">{data.refNumber}</span>
                                </div>
                                <div className="border-r border-white/30 pr-4">
                                    <span className="block opacity-50 mb-2">Expiry_T</span>
                                    <span className="text-lg">{data.validUntil}</span>
                                </div>
                                <div className="text-right">
                                    <span className="block opacity-50 mb-2">Security</span>
                                    <span className="text-lg text-yellow-300">CONFIDENTIAL</span>
                                </div>
                            </div>
                        </div>

                        {/* Aesthetic technical notes */}
                        <div className="absolute top-4 right-4 text-[8px] opacity-30 font-bold uppercase vertical-rl tracking-[0.3em]">
                            Technical Drawing No. HP-{data.refNumber.slice(-4)}-{new Date().getFullYear()}
                        </div>
                    </div>
                </Page>
            );
        }

        // 29. WARM BOHO
        if (data.coverStyle === 'warm-boho') {
            return (
                <Page isCover>
                    <div className="flex-1 bg-[#f5ebe0] p-16 flex flex-col relative overflow-hidden text-[#5e503f] h-full">
                        {/* Organic shapes */}
                        <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-[#e3d5ca] rounded-full opacity-60"></div>
                        <div className="absolute bottom-[-100px] right-[-100px] w-[600px] h-[600px] bg-[#d5bdaf] rounded-full opacity-60"></div>
                        <div className="absolute top-1/2 left-1/4 w-[300px] h-[300px] bg-[#eddcd2] rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>

                        <div className="relative z-10 flex-1 flex flex-col justify-between items-center text-center">
                            <div className="w-full flex justify-between items-start px-4 mt-8">
                                {data.logo ? <img src={data.logo} className="h-14 w-auto opacity-60 sepia contrast-125" alt="Logo" /> : <div className="text-2xl font-serif italic text-[#5e503f]/40">High Point</div>}
                                {data.clientLogo && <img src={data.clientLogo} className="h-16 w-auto opacity-30 sepia brightness-90 grayscale contrast-125" alt="Client Logo" />}
                            </div>

                            <div className="max-w-2xl px-8 py-16 border-y border-[#5e503f]/10 backdrop-blur-[1px]">
                                <span className="text-[10px] font-serif uppercase tracking-[0.5em] mb-8 block opacity-50 italic">
                                    {typeInfo.fullLabel} EDITION // PREPARED WITH CARE
                                </span>
                                <h1 className="text-6xl font-serif italic mb-10 leading-[1.1] break-words text-[#3d3121]">
                                    {data.title}
                                </h1>
                                <div className="flex flex-col items-center gap-6">
                                    <div className="w-px h-16 bg-[#5e503f]/20"></div>
                                    <p className="text-3xl font-serif italic text-[#5e503f]/80">
                                        A Partnership for <span className="font-bold border-b border-[#5e503f]/30 pb-1">{data.clientCompany}</span>
                                    </p>
                                    <p className="text-sm tracking-widest opacity-60 font-medium uppercase">{data.clientName} // v{data.version}.0</p>
                                </div>
                            </div>

                            <div className="w-full grid grid-cols-3 gap-12 text-[10px] uppercase font-bold tracking-[0.3em] opacity-40 mb-8 border-t border-[#5e503f]/5 pt-12">
                                <div>
                                    <p className="mb-2 italic">Date of Issue</p>
                                    <p className="text-base font-serif">{data.date}</p>
                                </div>
                                <div>
                                    <p className="mb-2 italic">Project Ref</p>
                                    <p className="text-base font-serif">{data.refNumber}</p>
                                </div>
                                <div>
                                    <p className="mb-2 italic">Valid Until</p>
                                    <p className="text-base font-serif">{data.validUntil}</p>
                                </div>
                            </div>
                        </div>

                        {/* Subtle decorative elements */}
                        <div className="absolute top-1/4 right-12 w-1.5 h-1.5 rounded-full bg-[#5e503f]/20"></div>
                        <div className="absolute top-1/3 right-12 w-1.5 h-1.5 rounded-full bg-[#5e503f]/10"></div>
                        <div className="absolute top-[35%] right-12 w-1.5 h-1.5 rounded-full bg-[#5e503f]/5"></div>
                    </div>
                </Page>
            );
        }

        // 30. GLASSMORPHISM
        if (data.coverStyle === 'glassmorphism') {
            return (
                <Page isCover>
                    <div className="flex-1 relative flex items-center justify-center p-20 bg-gradient-to-br from-pink-200 via-purple-200 to-indigo-200 h-full overflow-hidden">
                        {/* Orbs */}
                        <div className="absolute top-20 left-20 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-[120px] opacity-60 animate-blob"></div>
                        <div className="absolute top-20 right-20 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-[120px] opacity-60 animate-blob animation-delay-2000"></div>
                        <div className="absolute bottom-20 left-40 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-[120px] opacity-60 animate-blob animation-delay-4000"></div>

                        <div className="relative z-10 flex flex-col items-center">
                            <div className="mb-12 flex items-center gap-8 px-8 py-3 bg-white/20 backdrop-blur-3xl rounded-3xl border border-white/40 shadow-xl">
                                {data.logo ? <img src={data.logo} className="h-10 w-auto shadow-sm" alt="Logo" /> : <span className="text-xl font-black text-gray-800 tracking-tighter">HP.SOLUTIONS</span>}
                                {data.clientLogo && <img src={data.clientLogo} className="h-12 w-auto grayscale opacity-50 brightness-110" alt="Client Logo" />}
                            </div>

                            <div className="bg-white/40 backdrop-blur-2xl border border-white/30 p-20 rounded-[4rem] shadow-2xl w-full max-w-3xl text-center relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-50 pointer-events-none"></div>

                                <div className="inline-block px-5 py-1.5 rounded-full bg-white/60 border border-white/50 backdrop-blur-md mb-10 text-[10px] font-black tracking-[0.4em] text-indigo-800 uppercase shadow-sm">
                                    {typeInfo.fullLabel} ARCHITECTURE // v{data.version}.0
                                </div>

                                <h1 className="text-6xl font-black text-gray-900 mb-10 leading-[1.05] tracking-tighter break-words drop-shadow-sm">
                                    {data.title}
                                </h1>

                                <div className="space-y-4 mb-16 relative">
                                    <p className="text-sm font-bold uppercase tracking-widest text-indigo-950 opacity-40">Tailored Exclusively For</p>
                                    <p className="text-3xl font-black text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-indigo-900">{data.clientCompany}</p>
                                    <div className="flex flex-col items-center gap-1 opacity-60">
                                        <p className="text-lg font-medium italic text-indigo-950">{data.clientName}</p>
                                        <p className="text-[10px] font-bold tracking-widest">{data.clientEmail}</p>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center px-8 pt-10 border-t border-black/5">
                                    <div className="text-left font-bold text-[10px] uppercase tracking-widest text-indigo-900/40">
                                        <p className="mb-1">Issued_At</p>
                                        <p className="text-gray-900 text-sm">{data.date}</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-lg shadow-indigo-200 flex items-center justify-center">
                                            <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></div>
                                        </div>
                                    </div>
                                    <div className="text-right font-bold text-[10px] uppercase tracking-widest text-indigo-900/40">
                                        <p className="mb-1">Trace_ID</p>
                                        <p className="text-gray-900 text-sm font-mono uppercase">{data.refNumber}</p>
                                    </div>
                                </div>
                            </div>

                            <p className="mt-12 text-[10px] font-bold uppercase tracking-[0.5em] text-indigo-900/30">Sustainable Innovation & Trust // {new Date().getFullYear()}</p>
                        </div>
                    </div>
                </Page>
            );
        }
        // 31. MAGAZINE EDITORIAL
        if (data.coverStyle === 'magazine-editorial') {
            return (
                <Page isCover>
                    <div className="flex-1 bg-white flex flex-col relative h-full overflow-hidden">
                        <div className="flex-1 flex flex-row">
                            <div className="w-2/3 relative h-full bg-slate-100 flex items-center justify-center overflow-hidden border-r-[12px] border-black">
                                <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent z-10"></div>
                                {data.logo ? (
                                    <div className="relative z-20 flex flex-col items-center">
                                        <img src={data.logo} className="h-32 w-auto mix-blend-multiply contrast-125 grayscale" alt="Logo" />
                                        <div className="mt-8 px-6 py-2 bg-black text-white text-xs font-black tracking-[0.5em] uppercase shadow-2xl">ESTABLISHED {new Date().getFullYear()}</div>
                                    </div>
                                ) : (
                                    <h2 className="text-8xl font-black text-white drop-shadow-2xl opacity-40 select-none">HPS.</h2>
                                )}

                                <div className="absolute bottom-12 left-12 z-20">
                                    <div className="bg-white p-8 shadow-2xl border-l-[12px] max-w-sm" style={{ borderLeftColor: color }}>
                                        <p className="text-xs font-black uppercase tracking-widest mb-4 italic" style={{ color: color }}>Corporate Dossier // Issue {data.version}.0</p>
                                        <p className="text-sm font-bold text-gray-500 uppercase leading-snug tracking-tighter">Certified Strategic Proposal for high-value organizational transformation, specifically curated for {data.clientCompany}.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="w-1/3 flex flex-col justify-between p-12 bg-white">
                                <div className="space-y-12">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-300 mb-4 border-b border-gray-100 pb-2">Contributor</p>
                                        <p className="text-lg font-bold leading-tight">High Point Technology</p>
                                        <p className="text-xs text-gray-400 font-medium tracking-wide">Strategy Division 01</p>
                                    </div>

                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-300 mb-4 border-b border-gray-100 pb-2">Partner Analysis</p>
                                        <p className="text-2xl font-black leading-[1.1] uppercase tracking-tighter text-gray-900">{data.clientCompany}</p>
                                        <p className="text-sm text-gray-500 italic mt-2 font-medium">{data.clientName}</p>
                                        {data.clientLogo && <img src={data.clientLogo} className="h-10 w-auto grayscale mt-6 opacity-30 brightness-110" alt="Client Logo" />}
                                    </div>
                                </div>

                                <div className="space-y-6 pt-12 border-t border-black/10">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] font-black tracking-widest uppercase opacity-20">Vol. Archive</span>
                                        <span className="font-mono text-xs font-bold">{data.refNumber.slice(0, 8)}</span>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] font-black tracking-widest uppercase opacity-20">Release</span>
                                        <span className="font-mono text-xs font-bold">{data.date}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-12 pb-20 border-t-[12px] border-black flex flex-col items-center text-center bg-white relative z-20">
                            <span className="text-xs font-black uppercase tracking-[0.8em] text-gray-400 mb-8 block ml-[0.8em]">{typeInfo.fullLabel} / {data.type}</span>
                            <h1 className="text-[8rem] font-black leading-[0.8] uppercase tracking-tighter text-gray-900 break-words w-full shadow-text">
                                {data.title}
                            </h1>
                            <div className="mt-12 w-20 h-2 bg-black"></div>
                        </div>

                        <style dangerouslySetInnerHTML={{
                            __html: `
                            .shadow-text {
                                text-shadow: 0 10px 40px rgba(0,0,0,0.05);
                            }
                        ` }} />
                    </div>
                </Page>
            );
        }

        // 32. CORPORATE (Default Fallback)
        return (
            <Page isCover>
                <div className="flex-1 flex flex-col p-16 h-full relative overflow-hidden bg-slate-50">
                    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-slate-200/30 rounded-full -mr-96 -mt-96 z-0"></div>
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-slate-200/20 rounded-full -ml-40 -mb-40 z-0"></div>

                    <div className="relative z-10 flex flex-col h-full">
                        <div className="flex justify-between items-start mb-24">
                            <div className="space-y-4">
                                {data.logo ? (
                                    <img src={data.logo} className="h-12 w-auto shadow-sm" alt="Logo" />
                                ) : (
                                    <div className="text-2xl font-bold tracking-tight text-slate-900">HIGH POINT TECH</div>
                                )}
                                <div className="w-12 h-1.5" style={{ backgroundColor: color }}></div>
                            </div>
                            <div className="text-right">
                                {data.clientLogo && <img src={data.clientLogo} className="h-14 w-auto grayscale opacity-40 contrast-125" alt="Client Logo" />}
                                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mt-4">Document Ref: {data.refNumber}</p>
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col justify-center max-w-3xl">
                            <div className={`inline-block px-4 py-1.5 rounded-sm text-white text-xs font-bold uppercase tracking-widest mb-10`} style={{ backgroundColor: color }}>
                                {typeInfo.fullLabel} // v{data.version}.0
                            </div>
                            <h1 className="text-7xl font-bold text-slate-900 leading-[1.1] tracking-tight mb-12 break-words">
                                {data.title}
                            </h1>
                            <div className="flex items-center gap-6 mb-20">
                                <div className="h-px w-20 bg-slate-300"></div>
                                <p className="text-2xl text-slate-500 font-light italic">Prepared exclusively for {data.clientCompany}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-16 pt-16 border-t border-slate-200">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Contact Authority</p>
                                    <p className="text-xl font-bold text-slate-900">{data.clientName}</p>
                                    <p className="text-slate-500 mt-1">{data.clientEmail}</p>
                                </div>
                                <div className="flex flex-col justify-between">
                                    <div className="flex gap-12">
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Effective Date</p>
                                            <p className="text-lg font-bold text-slate-900">{data.date}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Valid Until</p>
                                            <p className="text-lg font-bold text-slate-900">{data.validUntil}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto flex justify-between items-center text-[10px] font-bold uppercase tracking-[0.4em] text-slate-300">
                            <p>© {new Date().getFullYear()} High Point Technology Worldwide</p>
                            <p>Confidential Business Intelligence</p>
                        </div>
                    </div>
                </div>
            </Page>
        );
    };

    return (
        <div className={`bg-transparent w-full flex flex-col gap-8 items-center text-black ${fontClass} relative print:block print:gap-0 min-h-screen`}>
            <PrintStyles />

            {/* 1. Cover Page */}
            <CoverPage data={data} color={color} typeInfo={typeInfo} />

            {/* 2. Table of Contents */}
            <Page pageNum={2} data={data}>
                <div className="flex-1 px-20 pt-8 flex flex-col justify-start h-full">
                    <div className="mb-12 border-b-2 border-slate-100 pb-6">
                        <span className="text-xs font-bold text-violet-600 tracking-widest uppercase mb-2 block">Document Overview</span>
                        <h1 className="text-5xl font-bold text-slate-900">Table of Contents</h1>
                    </div>

                    <div className="space-y-6">
                        {(data.stepOrder || ['executive', 'solution', 'financial', 'legal'])
                            .filter(id => id !== 'branding')
                            .map((id, index) => {
                                let title = defaultLabels[id as keyof typeof defaultLabels] || id;

                                if (!defaultLabels[id as keyof typeof defaultLabels]) {
                                    const customSection = data.customSections?.find(s => s.id === id);
                                    if (customSection) title = customSection.title;
                                }

                                return (
                                    <div key={id} className="group flex items-end">
                                        <div className="font-bold text-3xl text-slate-200 mr-8 w-12 group-hover:text-violet-600 transition-colors font-serif italic">
                                            {(index + 1).toString().padStart(2, '0')}
                                        </div>
                                        <div className="flex-1 mb-2 border-b border-dashed border-slate-200 pb-1 flex justify-between items-baseline">
                                            <span className="text-xl font-medium text-slate-800 uppercase tracking-wide">{title}</span>
                                            <span className="text-lg font-bold text-slate-400 group-hover:text-violet-600">0{index + 3}</span>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            </Page>

            {/* 2. Content Sections */}
            {(data.stepOrder || ['executive', 'solution', 'financial', 'legal'])
                .filter(id => id !== 'branding')
                .map((id, index) => renderSectionContent(id, index + 3))}
        </div>
    );
};
