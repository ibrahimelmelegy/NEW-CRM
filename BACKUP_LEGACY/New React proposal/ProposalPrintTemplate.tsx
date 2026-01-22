
import React from 'react';
import {
    FileText, CheckCircle, Briefcase, Clock,
    Cpu, Shield, Zap, PenTool as Pen, Layout, Hexagon
} from 'lucide-react';
// Correcting the import path to the root types file
import { ProposalData } from '../../types';

// Wrapper for each page to look like a sheet of paper
const PageSheet: React.FC<{ children: React.ReactNode; className?: string; pageNum?: number; data?: ProposalData }> = ({ children, className = '', pageNum, data }) => (
    <div className={`w-[210mm] min-h-[297mm] bg-white shadow-2xl mx-auto relative flex flex-col overflow-hidden print:shadow-none print:m-0 print:w-full print:h-[297mm] print:break-after-page ${className}`}>
        {/* Helper to ensure full height for flex children */}
        <div className="absolute inset-0 bg-white -z-10 h-full"></div>
        {pageNum && (
            <div className="absolute top-8 left-12 right-12 flex justify-between items-center border-b border-gray-100 pb-4 print:top-8 print:left-12 print:right-12">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest truncate max-w-[60%]">{data?.title}</span>
                <span className="text-[10px] text-gray-400 font-mono">{data?.refNumber}</span>
            </div>
        )}

        {children}

        {/* Footer - Only on content pages */}
        {pageNum && (
            <div className="absolute bottom-8 left-12 right-12 flex justify-between items-center border-t border-gray-100 pt-4 print:bottom-8 print:left-12 print:right-12">
                <div className="flex items-center gap-4">
                    {data?.logo ? (
                        <img src={data.logo} className="h-5 w-auto opacity-60 grayscale" alt="Logo" />
                    ) : (
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">High Point</span>
                    )}
                    <span className="h-3 w-px bg-gray-200"></span>
                    <span className="text-[10px] text-gray-400">Confidential</span>
                </div>
                <div className="text-[10px] font-mono text-gray-400 font-medium">
                    Page {pageNum}
                </div>
            </div>
        )}
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

    // Get labels defaulting to standard names
    const labels = {
        branding: 'Branding & Details',
        executive: 'Executive Summary',
        solution: 'Solution & Scope',
        financial: 'Investment',
        legal: 'Terms & Legal',
        ...data.stepLabels
    };

    // --- Content Renderers ---
    const renderSectionContent = (id: string, index: number) => {
        const commonPadding = "pt-24 px-16 pb-20"; // Adjusted for header/footer space

        if (id === 'executive') {
            return (
                <PageSheet key={id} pageNum={index} data={data}>
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
                                        <CheckCircle size={18} style={{ color: color }} /> Key Objectives
                                    </h3>
                                    <div className="proposal-rich-text" dangerouslySetInnerHTML={{ __html: data.objectives }}></div>
                                </div>
                            )}
                        </div>
                    </div>
                </PageSheet>
            );
        }

        if (id === 'solution') {
            return (
                <PageSheet key={id} pageNum={index} data={data}>
                    <div className={`flex-1 ${commonPadding}`}>
                        <div className="mb-10">
                            <h2 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                                <span className="text-gray-200 font-mono">0{index}</span>
                                {labels.solution}
                            </h2>
                            <div className="mb-8">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Scope of Work</h3>
                                <div className="proposal-rich-text" dangerouslySetInnerHTML={{ __html: data.scopeOfWork }}></div>
                            </div>
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
                </PageSheet>
            );
        }

        if (id === 'financial') {
            return (
                <PageSheet key={id} pageNum={index} data={data}>
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
                </PageSheet>
            );
        }

        if (id === 'legal') {
            return (
                <PageSheet key={id} pageNum={index} data={data}>
                    <div className={`flex-1 ${commonPadding} flex flex-col`}>
                        <h2 className="text-3xl font-bold text-gray-900 mb-10 flex items-center gap-3">
                            <span className="text-gray-200 font-mono">0{index}</span>
                            {labels.legal}
                        </h2>
                        <div className="grid grid-cols-1 gap-12 flex-1">
                            <div>
                                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <FileText size={18} className="text-gray-400" /> Terms & Conditions
                                </h3>
                                <div className="proposal-rich-text text-sm text-gray-600" dangerouslySetInnerHTML={{ __html: data.termsAndConditions }}></div>
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Clock size={18} className="text-gray-400" /> Payment Schedule
                                </h3>
                                <div className="proposal-rich-text text-sm text-gray-600" dangerouslySetInnerHTML={{ __html: data.paymentTerms }}></div>
                            </div>
                        </div>
                    </div>
                </PageSheet>
            );
        }

        const customSection = data.customSections?.find(s => s.id === id);
        if (customSection) {
            return (
                <PageSheet key={id} pageNum={index} data={data}>
                    <div className={`flex-1 ${commonPadding}`}>
                        <h2 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                            <span className="text-gray-200 font-mono">0{index}</span>
                            {customSection.title}
                        </h2>
                        <div className="proposal-rich-text" dangerouslySetInnerHTML={{ __html: customSection.content }}></div>
                    </div>
                </PageSheet>
            );
        }

        return null;
    };

    // --- COVER PAGE STYLES ---

    const CoverPage = () => {
        // 1. BUSINESS
        if (data.coverStyle === 'business') {
            return (
                <PageSheet>
                    <div className="flex-1 flex flex-row h-full">
                        <div className="w-1/3 bg-gray-900 text-white p-12 flex flex-col justify-between">
                            {data.logo ? (
                                <img src={data.logo} className="h-10 w-auto brightness-0 invert opacity-80" alt="Logo" />
                            ) : (
                                <div className="text-2xl font-bold tracking-tight">HIGH POINT</div>
                            )}
                            <div className="space-y-8">
                                <div>
                                    <span className="block text-xs opacity-50 uppercase tracking-wider mb-1">Prepared For</span>
                                    <p className="font-bold text-lg leading-tight">{data.clientCompany}</p>
                                    <p className="opacity-70 text-sm">{data.clientName}</p>
                                </div>
                                <div>
                                    <span className="block text-xs opacity-50 uppercase tracking-wider mb-1">Prepared By</span>
                                    <p className="font-bold text-lg leading-tight">High Point Tech</p>
                                </div>
                            </div>
                            <div className="text-xs opacity-40 font-mono">
                                {data.refNumber}
                            </div>
                        </div>
                        <div className="w-2/3 bg-white p-20 flex flex-col justify-center h-full">
                            {/* Use dynamic color here */}
                            <span className="font-bold tracking-wider uppercase mb-6 text-sm" style={{ color: color }}>
                                Strategic Proposal
                            </span>
                            <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-8">{data.title}</h1>
                            <div className="w-20 h-2 bg-gray-100" style={{ backgroundColor: `${color}40` }}></div>
                        </div>
                    </div>
                </PageSheet>
            );
        }

        // 2. CREATIVE
        if (data.coverStyle === 'creative') {
            return (
                <PageSheet>
                    <div className="flex-1 flex flex-col justify-between p-20 relative overflow-hidden">
                        {/* Geometric Background Shapes */}
                        <div className="absolute top-0 right-0 w-[80%] h-full transform skew-x-12 origin-top-right z-0" style={{ backgroundColor: `${color}10` }}></div>
                        <div className="absolute bottom-0 left-0 w-full h-[40%] transform -skew-y-6 origin-bottom-left z-0" style={{ backgroundColor: color }}></div>

                        <div className="relative z-10">
                            {data.logo ? (
                                <img src={data.logo} className="h-16 w-auto mb-16" alt="Logo" />
                            ) : (
                                <div className="text-3xl font-black tracking-tighter mb-16">HP.</div>
                            )}

                            <div className="max-w-2xl">
                                <span className="inline-block px-3 py-1 mb-6 text-sm font-bold tracking-widest uppercase border-2 border-black">
                                    Proposal
                                </span>
                                <h1 className="text-7xl font-black leading-none mb-6 text-gray-900">
                                    {data.title}
                                </h1>
                                <p className="text-xl text-gray-600 font-medium">
                                    Prepared for {data.clientCompany}
                                </p>
                            </div>
                        </div>

                        <div className="relative z-10 flex justify-between items-end text-white mt-auto">
                            <div>
                                <p className="text-sm font-bold opacity-80 uppercase tracking-widest mb-1">Date</p>
                                <p className="text-xl">{data.date}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold opacity-80 uppercase tracking-widest mb-1">Reference</p>
                                <p className="text-xl font-mono">{data.refNumber}</p>
                            </div>
                        </div>
                    </div>
                </PageSheet>
            );
        }

        // 3. ENTERPRISE
        if (data.coverStyle === 'enterprise') {
            return (
                <PageSheet>
                    <div className="flex-1 flex flex-col p-16">
                        {/* Top Bar */}
                        <div className="w-full h-2 mb-16" style={{ backgroundColor: color }}></div>

                        <div className="flex justify-between items-start mb-24">
                            <div>
                                {data.logo ? <img src={data.logo} className="h-12 w-auto" alt="Logo" /> : <div className="font-bold text-2xl text-gray-800">High Point</div>}
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-500 font-medium">confidential document</p>
                            </div>
                        </div>

                        <div className="flex-1">
                            <h1 className="text-5xl font-bold text-gray-900 mb-8 leading-tight max-w-3xl">
                                {data.title}
                            </h1>
                            <div className="w-24 h-1 bg-gray-200 mb-12"></div>

                            <div className="bg-gray-50 border border-gray-200 p-8 max-w-md">
                                <div className="mb-6">
                                    <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Prepared For</span>
                                    <p className="text-xl font-bold text-gray-900">{data.clientCompany}</p>
                                    <p className="text-gray-600">{data.clientName}</p>
                                </div>
                                <div>
                                    <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Prepared By</span>
                                    <p className="text-lg font-bold text-gray-900">High Point Technology</p>
                                </div>
                            </div>
                        </div>

                        {/* Footer Grid */}
                        <div className="grid grid-cols-3 gap-8 border-t-2 border-gray-100 pt-8">
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
                </PageSheet>
            );
        }

        // 4. TECH
        if (data.coverStyle === 'tech') {
            return (
                <PageSheet className="bg-slate-900 text-white font-mono">
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
                </PageSheet>
            );
        }

        // 5. MINIMAL
        if (data.coverStyle === 'minimal') {
            return (
                <PageSheet>
                    <div className="flex-1 flex flex-col items-center justify-center p-24 text-center">
                        <div className="mb-16">
                            {data.logo ? <img src={data.logo} className="h-20 w-auto object-contain mx-auto opacity-80" alt="Logo" /> : <div className="text-xl font-bold tracking-widest uppercase">High Point</div>}
                        </div>

                        <div className="w-16 h-1 bg-gray-900 mb-12"></div>

                        <h1 className="text-4xl font-light tracking-tight text-gray-900 mb-6 leading-tight max-w-2xl">
                            {data.title}
                        </h1>

                        <p className="text-sm text-gray-400 uppercase tracking-widest mb-24">
                            Project Proposal
                        </p>

                        <div className="text-sm text-gray-500 space-y-1 mt-auto">
                            <p>Prepared for <span className="text-gray-900 font-medium">{data.clientCompany}</span></p>
                            <p>{data.date}</p>
                        </div>
                    </div>
                </PageSheet>
            );
        }

        // 6. MODERN ART
        if (data.coverStyle === 'modern-art') {
            return (
                <PageSheet>
                    <div className="flex-1 relative overflow-hidden flex flex-col justify-center p-24">
                        {/* Background blobs */}
                        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-20" style={{ backgroundColor: color }}></div>
                        <div className="absolute bottom-[-5%] left-[-5%] w-[400px] h-[400px] rounded-full opacity-10" style={{ backgroundColor: color }}></div>
                        <div className="absolute top-[20%] left-[10%] w-24 h-24 rounded-full border-4 opacity-20" style={{ borderColor: color }}></div>

                        <div className="relative z-10">
                            <div className="mb-12">
                                {data.logo ? <img src={data.logo} className="h-20 w-auto object-contain" alt="Logo" /> : <span className="text-3xl font-bold tracking-tighter">HP.</span>}
                            </div>

                            <h1 className="text-7xl font-black text-gray-900 leading-tight mb-8">
                                {data.title}
                            </h1>

                            <div className="flex items-center gap-4 mb-16">
                                <div className="h-1 w-24" style={{ backgroundColor: color }}></div>
                                <p className="text-xl font-medium text-gray-500">Prepared for {data.clientCompany}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-12 text-sm mt-auto">
                                <div>
                                    <p className="font-bold text-gray-400 uppercase tracking-widest mb-1">Date</p>
                                    <p>{data.date}</p>
                                </div>
                                <div>
                                    <p className="font-bold text-gray-400 uppercase tracking-widest mb-1">Ref</p>
                                    <p>{data.refNumber}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </PageSheet>
            );
        }

        // 7. GEOMETRIC
        if (data.coverStyle === 'geometric') {
            return (
                <PageSheet>
                    <div className="flex-1 flex bg-white">
                        {/* Left Sidebar */}
                        <div className="w-[35%] bg-slate-900 text-white p-12 flex flex-col justify-between relative overflow-hidden">
                            {/* Decor */}
                            <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: color }}></div>
                            <div className="absolute bottom-0 right-0 w-24 h-24 bg-white opacity-5 transform rotate-45 translate-y-12 translate-x-12"></div>

                            <div>
                                {data.logo ? <img src={data.logo} className="h-12 w-auto mb-12 brightness-0 invert" alt="Logo" /> : <div className="text-2xl font-bold mb-12">LOGO</div>}

                                <div className="space-y-8">
                                    <div>
                                        <p className="text-xs opacity-50 uppercase tracking-widest mb-2">Client</p>
                                        <p className="text-xl font-bold">{data.clientCompany}</p>
                                        <p className="opacity-70">{data.clientName}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs opacity-50 uppercase tracking-widest mb-2">Details</p>
                                        <p className="opacity-70">{data.date}</p>
                                        <p className="opacity-70">Valid: {data.validUntil}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="font-mono text-xs opacity-30">
                                {data.refNumber}
                            </div>
                        </div>

                        {/* Right Content */}
                        <div className="flex-1 p-20 flex flex-col justify-center relative">
                            <div className="absolute top-20 right-20 w-32 h-32 border-8 opacity-20" style={{ borderColor: color }}></div>

                            <p className="text-sm font-bold uppercase tracking-[0.2em] text-gray-400 mb-6">Project Proposal</p>
                            <h1 className="text-6xl font-bold text-slate-900 mb-12 leading-tight">
                                {data.title}
                            </h1>

                            <div className="border-l-4 pl-6" style={{ borderColor: color }}>
                                <p className="text-gray-500 italic">
                                    "Innovative solutions for a better future."
                                </p>
                            </div>
                        </div>
                    </div>
                </PageSheet>
            );
        }

        // 8. BOLD TYPOGRAPHY
        if (data.coverStyle === 'bold-typography') {
            return (
                <PageSheet>
                    <div className="flex-1 flex flex-col relative bg-white">
                        {/* Left color bar */}
                        <div className="absolute left-0 top-0 bottom-0 w-6" style={{ backgroundColor: color }}></div>

                        <div className="flex-1 flex flex-col justify-center px-24 py-20 relative z-10">
                            {data.logo && <img src={data.logo} className="h-16 w-auto mb-20 self-start" alt="Logo" />}

                            <div className="mb-12">
                                <span className="block text-sm font-bold tracking-[0.3em] uppercase text-gray-400 mb-4">
                                    Project Proposal
                                </span>
                                <h1 className="text-8xl font-black text-slate-900 leading-[0.9] tracking-tight">
                                    {data.title}
                                </h1>
                            </div>

                            <div className="w-24 h-2 bg-slate-900 mb-12"></div>

                            <div className="flex gap-16">
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Prepared For</p>
                                    <p className="text-xl font-bold text-slate-800">{data.clientCompany}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Date</p>
                                    <p className="text-xl font-bold text-slate-800">{data.date}</p>
                                </div>
                            </div>
                        </div>

                        {/* Big ref number watermark */}
                        <div className="absolute bottom-10 right-10 text-9xl font-black text-gray-50 opacity-50 pointer-events-none select-none">
                            {new Date(data.date).getFullYear()}
                        </div>
                    </div>
                </PageSheet>
            );
        }

        // 9. GRADIENT SPLASH
        if (data.coverStyle === 'gradient-splash') {
            return (
                <PageSheet>
                    <div className="flex-1 flex flex-col relative bg-white overflow-hidden">
                        {/* Top Gradient Curve */}
                        <div className="absolute top-0 left-0 w-full h-[60%] rounded-b-[100px] z-0"
                            style={{ background: `linear-gradient(135deg, ${color} 0%, #ffffff 150%)` }}>
                        </div>

                        <div className="relative z-10 p-20 flex flex-col h-full justify-between">
                            <div className="text-white">
                                {data.logo ? (
                                    <img src={data.logo} className="h-16 w-auto brightness-0 invert" alt="Logo" />
                                ) : (
                                    <span className="text-2xl font-bold tracking-tight">HIGH POINT</span>
                                )}
                            </div>

                            <div className="bg-white/90 backdrop-blur-xl p-12 rounded-3xl shadow-2xl border border-white/50 mt-20">
                                <span className="inline-block px-3 py-1 mb-6 text-xs font-bold tracking-widest uppercase bg-slate-900 text-white rounded">
                                    Proposal
                                </span>
                                <h1 className="text-5xl font-bold text-slate-900 mb-6 leading-tight">
                                    {data.title}
                                </h1>
                                <p className="text-xl text-gray-500 font-medium">
                                    Prepared for <strong className="text-slate-900">{data.clientCompany}</strong>
                                </p>
                            </div>

                            <div className="flex justify-between items-end mt-auto text-gray-400 text-sm font-medium">
                                <div>
                                    <p>Valid Until: {data.validUntil}</p>
                                    <p>Ref: {data.refNumber}</p>
                                </div>
                                <div className="text-right">
                                    <p>High Point Technology</p>
                                    <p>www.highpoint.com</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </PageSheet>
            );
        }

        // 10. SWISS (International Style)
        if (data.coverStyle === 'swiss') {
            return (
                <PageSheet>
                    <div className="flex-1 flex flex-col p-12 relative bg-[#f4f4f4]">
                        <div className="flex-1 grid grid-cols-12 grid-rows-6 gap-4 h-full border-t-4 border-black pt-8">
                            {/* Title Block */}
                            <div className="col-span-12 row-span-2">
                                <h1 className="text-8xl font-bold tracking-tighter leading-none text-black mb-4">
                                    {data.title}
                                </h1>
                                <div className="w-32 h-2 bg-red-600"></div>
                            </div>

                            {/* Client Info */}
                            <div className="col-span-4 row-span-2 col-start-1 row-start-4">
                                <p className="text-sm font-bold uppercase tracking-wide mb-2 text-gray-500">Client</p>
                                <p className="text-xl font-bold text-black">{data.clientCompany}</p>
                                <p className="text-lg text-gray-700">{data.clientName}</p>
                            </div>

                            {/* Date/Ref */}
                            <div className="col-span-4 row-span-2 col-start-5 row-start-4">
                                <p className="text-sm font-bold uppercase tracking-wide mb-2 text-gray-500">Details</p>
                                <p className="font-mono text-black">{data.date}</p>
                                <p className="font-mono text-black">{data.refNumber}</p>
                            </div>

                            {/* Logo Area */}
                            <div className="col-span-4 row-span-1 col-start-9 row-start-6 flex justify-end items-end">
                                {data.logo ? (
                                    <img src={data.logo} className="h-16 w-auto grayscale" alt="Logo" />
                                ) : (
                                    <span className="text-2xl font-bold tracking-tight">HIGH POINT</span>
                                )}
                            </div>
                        </div>
                    </div>
                </PageSheet>
            );
        }

        // 11. DARK MODE
        if (data.coverStyle === 'dark-mode') {
            return (
                <PageSheet>
                    <div className="flex-1 flex flex-col p-20 bg-slate-950 text-white relative overflow-hidden">
                        {/* Glow effects */}
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-600 rounded-full blur-[120px] opacity-20"></div>
                        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600 rounded-full blur-[100px] opacity-10"></div>

                        <div className="relative z-10 flex-1 flex flex-col justify-center">
                            <div className="mb-12">
                                {data.logo ? (
                                    <img src={data.logo} className="h-16 w-auto brightness-0 invert opacity-90" alt="Logo" />
                                ) : (
                                    <span className="text-2xl font-bold tracking-tight">HIGH POINT</span>
                                )}
                            </div>

                            <div className="border-l-2 pl-8 border-violet-500">
                                <span className="text-violet-400 font-mono text-sm tracking-widest uppercase mb-4 block">
                                  // Project Proposal
                                </span>
                                <h1 className="text-6xl font-bold mb-6 leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                                    {data.title}
                                </h1>
                                <p className="text-2xl text-gray-400 font-light">
                                    Prepared for <span className="text-white font-medium">{data.clientCompany}</span>
                                </p>
                            </div>
                        </div>

                        <div className="relative z-10 grid grid-cols-3 border-t border-slate-800 pt-8 mt-auto">
                            <div>
                                <span className="text-slate-500 text-xs uppercase tracking-wider block mb-1">Date</span>
                                <span className="font-mono text-sm">{data.date}</span>
                            </div>
                            <div>
                                <span className="text-slate-500 text-xs uppercase tracking-wider block mb-1">Valid Until</span>
                                <span className="font-mono text-sm">{data.validUntil}</span>
                            </div>
                            <div className="text-right">
                                <span className="text-slate-500 text-xs uppercase tracking-wider block mb-1">Reference</span>
                                <span className="font-mono text-sm text-violet-400">{data.refNumber}</span>
                            </div>
                        </div>
                    </div>
                </PageSheet>
            );
        }

        // 12. ARCHITECTURAL
        if (data.coverStyle === 'architectural') {
            return (
                <PageSheet>
                    <div className="flex-1 flex flex-col p-12 bg-[#fffdf5] text-slate-800 relative">
                        {/* Graph paper background */}
                        <div className="absolute inset-0 opacity-10 pointer-events-none"
                            style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                        </div>

                        {/* Content Frame */}
                        <div className="border-4 border-slate-800 h-full p-8 flex flex-col justify-between relative z-10 bg-white/50 backdrop-blur-sm">
                            <div className="flex justify-between items-start border-b-2 border-slate-800 pb-8">
                                <div>
                                    <h1 className="text-4xl font-bold uppercase tracking-wider mb-2">{data.title}</h1>
                                    <p className="font-mono text-sm uppercase tracking-widest text-slate-500">Project Spec // {data.refNumber}</p>
                                </div>
                                <div className="text-right">
                                    {data.logo ? <img src={data.logo} className="h-12 w-auto" alt="Logo" /> : <div className="font-bold text-xl">HP-TECH</div>}
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
                </PageSheet>
            );
        }

        // 13. ABSTRACT
        if (data.coverStyle === 'abstract') {
            return (
                <PageSheet>
                    <div className="flex-1 relative overflow-hidden bg-white p-20 flex flex-col justify-center">
                        {/* Abstract Blobs */}
                        <div className="absolute top-[-10%] right-[-15%] w-[800px] h-[800px] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" style={{ backgroundColor: '#e0e7ff' }}></div>
                        <div className="absolute bottom-[-10%] left-[-15%] w-[600px] h-[600px] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" style={{ backgroundColor: `${color}40` }}></div>
                        <div className="absolute top-[40%] left-[40%] w-[400px] h-[400px] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" style={{ backgroundColor: '#fce7f3' }}></div>

                        <div className="relative z-10 text-center">
                            <div className="mb-12 flex justify-center">
                                {data.logo ? <img src={data.logo} className="h-20 w-auto object-contain" alt="Logo" /> : <span className="text-3xl font-bold tracking-tighter">HP.</span>}
                            </div>

                            <span className="inline-block py-1 px-3 rounded-full bg-gray-100 text-gray-50 text-xs font-bold uppercase tracking-widest mb-8">
                                Proposal
                            </span>

                            <h1 className="text-6xl md:text-7xl font-light text-gray-900 mb-8 leading-tight tracking-tight">
                                {data.title}
                            </h1>

                            <div className="w-16 h-1 bg-gray-900 mx-auto mb-8 rounded-full"></div>

                            <p className="text-xl text-gray-500 font-light">
                                Prepared exclusively for <strong className="text-gray-900 font-medium">{data.clientCompany}</strong>
                            </p>
                        </div>

                        <div className="absolute bottom-12 left-0 w-full text-center">
                            <p className="text-sm text-gray-400 font-light tracking-widest uppercase">{data.date} • {data.refNumber}</p>
                        </div>
                    </div>
                </PageSheet>
            );
        }

        // 14. NEON NIGHT (New)
        if (data.coverStyle === 'neon-night') {
            return (
                <PageSheet>
                    <div className="flex-1 flex flex-col p-16 bg-black text-white relative overflow-hidden">
                        {/* Neon Elements */}
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-cyan-400 via-pink-500 to-yellow-500"></div>
                        <div className="absolute bottom-0 right-0 w-2/3 h-1 bg-gradient-to-l from-cyan-400 to-transparent"></div>

                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-pink-500/20 blur-sm"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[580px] h-[580px] rounded-full border border-cyan-400/20 blur-sm"></div>

                        <div className="relative z-10 flex justify-between items-start mb-24">
                            {data.logo ? <img src={data.logo} className="h-10 w-auto brightness-0 invert" alt="Logo" /> : <div className="font-bold text-2xl tracking-tighter">HP.NEON</div>}
                            <div className="px-3 py-1 border border-cyan-400 rounded-full text-cyan-400 text-xs tracking-widest uppercase shadow-[0_0_10px_rgba(34,211,238,0.3)]"> Confidential</div>
                        </div>

                        <div className="relative z-10 flex-1 flex flex-col justify-center items-start">
                            <h1 className="text-7xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500" style={{ textShadow: `0 0 30px ${color}` }}>
                                {data.title}
                            </h1>
                            <div className="h-1 w-32 bg-pink-500 mb-8 shadow-[0_0_15px_rgba(236,72,153,0.8)]"></div>

                            <p className="text-xl text-gray-400 font-light">
                                Prepared for <span className="text-white font-bold">{data.clientCompany}</span>
                            </p>
                        </div>

                        <div className="relative z-10 grid grid-cols-2 gap-8 text-sm text-gray-500 font-mono mt-auto">
                            <div>
                                <p className="mb-1 text-cyan-400">DATE_ISSUED</p>
                                <p>{data.date}</p>
                            </div>
                            <div className="text-right">
                                <p className="mb-1 text-pink-500">REF_CODE</p>
                                <p>{data.refNumber}</p>
                            </div>
                        </div>
                    </div>
                </PageSheet>
            );
        }

        // 15. BRUTALIST (New)
        if (data.coverStyle === 'brutalist') {
            return (
                <PageSheet>
                    <div className="flex-1 flex flex-col bg-[#e5e5e5] p-8 border-[16px] border-black">
                        <div className="flex-1 border-4 border-black p-8 flex flex-col justify-between relative bg-white">
                            <div className="absolute top-8 right-8 bg-black text-white px-4 py-2 text-2xl font-bold transform rotate-2">
                                PROPOSAL
                            </div>

                            <div className="border-b-4 border-black pb-8">
                                {data.logo ? <img src={data.logo} className="h-16 grayscale contrast-200" alt="Logo" /> : <h2 className="text-4xl font-black uppercase">High Point</h2>}
                            </div>

                            <div className="my-12">
                                <h1 className="text-8xl font-black uppercase leading-[0.85] tracking-tighter text-black break-words">
                                    {data.title}
                                </h1>
                            </div>

                            <div className="grid grid-cols-2 border-t-4 border-black">
                                <div className="border-r-4 border-black p-6">
                                    <p className="font-bold text-sm uppercase mb-2">Client</p>
                                    <p className="text-2xl font-bold">{data.clientCompany}</p>
                                </div>
                                <div className="p-6">
                                    <p className="font-bold text-sm uppercase mb-2">Date</p>
                                    <p className="text-2xl font-bold">{data.date}</p>
                                </div>
                            </div>

                            <div className="bg-black text-white p-4 font-mono text-center text-sm uppercase tracking-widest mt-auto">
                                REF: {data.refNumber}
                            </div>
                        </div>
                    </div>
                </PageSheet>
            );
        }

        // 16. NATURE (New)
        if (data.coverStyle === 'nature') {
            return (
                <PageSheet>
                    <div className="flex-1 flex flex-col bg-[#fdfcf0] p-16 relative overflow-hidden">
                        {/* Organic shapes */}
                        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#e8eed9] rounded-bl-[300px] z-0"></div>
                        <div className="absolute bottom-0 left-0 w-[500px] h-[400px] bg-[#dce3c8] rounded-tr-[200px] z-0"></div>

                        <div className="relative z-10 flex justify-between items-center mb-32">
                            {data.logo ? <img src={data.logo} className="h-12 w-auto opacity-80" alt="Logo" /> : <span className="font-serif text-2xl text-[#4a5d23]">High Point</span>}
                        </div>

                        <div className="relative z-10 max-w-2xl">
                            <span className="text-[#8c9e5e] font-serif italic text-xl mb-4 block">A Proposal for {data.clientCompany}</span>
                            <h1 className="text-6xl font-serif text-[#2c3e10] leading-tight mb-8">
                                {data.title}
                            </h1>
                            <div className="h-px w-24 bg-[#8c9e5e]"></div>
                        </div>

                        <div className="relative z-10 mt-auto flex gap-12 text-[#5f6f3e] font-serif">
                            <div>
                                <p className="text-xs uppercase tracking-widest mb-1">Date</p>
                                <p className="text-lg">{data.date}</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-widest mb-1">Reference</p>
                                <p className="text-lg">{data.refNumber}</p>
                            </div>
                        </div>
                    </div>
                </PageSheet>
            );
        }

        // 17. JAPANESE MINIMAL (New)
        if (data.coverStyle === 'japanese-minimal') {
            return (
                <PageSheet>
                    <div className="flex-1 flex bg-[#f9f7f2] relative p-16">
                        {/* Vertical text layout simulation */}
                        <div className="absolute right-24 top-24 bottom-24 w-24 border-l border-red-600/30 flex flex-col items-center py-8 writing-vertical-rl">
                            <span className="text-xs text-gray-400 uppercase tracking-[0.3em] rotate-180" style={{ writingMode: 'vertical-rl' }}>
                                {data.refNumber} • {data.date}
                            </span>
                        </div>

                        <div className="flex-1 flex flex-col justify-center items-center z-10 relative">
                            <div className="w-32 h-32 rounded-full bg-red-600 mb-16 shadow-xl shadow-red-200"></div>

                            <div className="text-center max-w-lg">
                                <h1 className="text-5xl font-light text-gray-900 mb-8 leading-snug tracking-wide">
                                    {data.title}
                                </h1>
                                <p className="text-sm text-gray-500 uppercase tracking-[0.2em] mb-2">Prepared For</p>
                                <p className="text-xl font-medium text-gray-800">{data.clientCompany}</p>
                            </div>
                        </div>

                        <div className="absolute top-16 left-16">
                            {data.logo ? <img src={data.logo} className="h-10 w-auto opacity-50 grayscale" alt="Logo" /> : <div className="w-8 h-8 border border-gray-400"></div>}
                        </div>
                    </div>
                </PageSheet>
            );
        }

        // 18. RETRO POP (New)
        if (data.coverStyle === 'retro-pop') {
            return (
                <PageSheet>
                    <div className="flex-1 flex flex-col bg-yellow-300 p-12 relative overflow-hidden">
                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #000 2px, transparent 2.5px)', backgroundSize: '20px 20px' }}></div>

                        {/* Shapes */}
                        <div className="absolute top-20 right-[-50px] w-64 h-64 bg-pink-500 rounded-full border-4 border-black"></div>
                        <div className="absolute bottom-20 left-[-50px] w-0 h-0 border-l-[100px] border-l-transparent border-t-[150px] border-t-blue-600 border-r-[100px] border-r-transparent transform rotate-45"></div>
                        <div className="absolute bottom-40 right-20 w-32 h-32 bg-white border-4 border-black transform rotate-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"></div>

                        <div className="relative z-10 bg-white border-4 border-black p-12 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] max-w-3xl mx-auto mt-20">
                            <div className="mb-8 text-center">
                                <span className="bg-black text-white px-4 py-1 text-xl font-bold uppercase transform -rotate-2 inline-block">Proposal</span>
                            </div>

                            <h1 className="text-6xl font-black text-center text-black mb-8 leading-none uppercase italic">
                                {data.title}
                            </h1>

                            <div className="flex justify-center mb-8">
                                <div className="h-4 w-full bg-blue-500 border-y-4 border-black"></div>
                            </div>

                            <div className="text-center">
                                <p className="font-bold text-xl mb-2">FOR: {data.clientCompany}</p>
                                <p className="font-mono text-sm">{data.date}</p>
                            </div>
                        </div>

                        <div className="mt-auto relative z-10 flex justify-between font-black text-xl">
                            <div className="bg-white border-2 border-black px-4 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                High Point
                            </div>
                            <div className="bg-white border-2 border-black px-4 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                v{data.version}.0
                            </div>
                        </div>
                    </div>
                </PageSheet>
            );
        }

        // 19. FUTURISTIC GRID (New)
        if (data.coverStyle === 'futuristic-grid') {
            return (
                <PageSheet>
                    <div className="flex-1 flex flex-col bg-slate-900 text-cyan-400 p-12 relative font-mono">
                        {/* Grid */}
                        <div className="absolute inset-0 opacity-20"
                            style={{
                                backgroundImage: 'linear-gradient(rgba(34, 211, 238, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 211, 238, 0.5) 1px, transparent 1px)',
                                backgroundSize: '40px 40px'
                            }}>
                        </div>

                        {/* Interface Elements */}
                        <div className="absolute top-8 left-8 w-4 h-4 border-t-2 border-l-2 border-cyan-400"></div>
                        <div className="absolute top-8 right-8 w-4 h-4 border-t-2 border-r-2 border-cyan-400"></div>
                        <div className="absolute bottom-8 left-8 w-4 h-4 border-b-2 border-l-2 border-cyan-400"></div>
                        <div className="absolute bottom-8 right-8 w-4 h-4 border-b-2 border-r-2 border-cyan-400"></div>

                        <div className="relative z-10 flex justify-between items-center mb-32 border-b border-cyan-900 pb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-cyan-400 animate-pulse"></div>
                                <span className="text-sm tracking-widest">SYSTEM_READY</span>
                            </div>
                            <div className="text-xs opacity-70">
                                ID: {data.refNumber}
                            </div>
                        </div>

                        <div className="relative z-10 max-w-4xl border-l-4 border-cyan-500 pl-8 py-4 bg-slate-800/50 backdrop-blur-sm">
                            <p className="text-xs text-cyan-200 mb-2 uppercase tracking-widest">&gt;&gt;&gt; Project_File_Init</p>
                            <h1 className="text-5xl font-bold text-white mb-6 leading-tight tracking-tight uppercase">
                                {data.title}
                            </h1>
                            <div className="flex gap-8 text-sm">
                                <div>
                                    <span className="block text-cyan-600 text-xs">CLIENT_TARGET</span>
                                    <span className="text-white">{data.clientCompany}</span>
                                </div>
                                <div>
                                    <span className="block text-cyan-600 text-xs">EXECUTION_DATE</span>
                                    <span className="text-white">{data.date}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto relative z-10">
                            <div className="w-full h-px bg-cyan-900 mb-4"></div>
                            <div className="flex justify-between text-xs text-cyan-600">
                                <span>HIGH POINT TECHNOLOGY // SECURE TRANSMISSION</span>
                                <span>PAGE 01 OF END</span>
                            </div>
                        </div>
                    </div>
                </PageSheet>
            );
        }

        // 20. ETHEREAL (Nature but Purple/Soft)
        if (data.coverStyle === 'ethereal') {
            return (
                <PageSheet>
                    <div className="flex-1 flex flex-col bg-[#fdfaff] p-16 relative overflow-hidden text-[#5e503f]">
                        {/* Organic shapes with Purple/Violet Gradients */}
                        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-bl-[300px] z-0"
                            style={{ background: `linear-gradient(135deg, ${color}10 0%, ${color}40 100%)` }}></div>
                        <div className="absolute bottom-0 left-0 w-[500px] h-[400px] rounded-tr-[200px] z-0"
                            style={{ background: `linear-gradient(45deg, ${color}30 0%, ${color}05 100%)` }}></div>

                        <div className="relative z-10 flex justify-between items-center mb-32">
                            {data.logo ? <img src={data.logo} className="h-12 w-auto opacity-90" alt="Logo" /> : <span className="font-serif text-2xl" style={{ color: color }}>High Point</span>}
                        </div>

                        <div className="relative z-10 max-w-2xl">
                            <span className="font-serif italic text-xl mb-4 block" style={{ color: `${color}cc` }}>A Proposal for {data.clientCompany}</span>
                            <h1 className="text-6xl font-serif leading-tight mb-8" style={{ color: '#2e1065' }}> {/* Very Dark Violet */}
                                {data.title}
                            </h1>
                            <div className="h-px w-24" style={{ backgroundColor: color }}></div>
                        </div>

                        <div className="relative z-10 mt-auto flex gap-12 font-serif" style={{ color: '#4c1d95' }}> {/* Dark Violet */}
                            <div>
                                <p className="text-xs uppercase tracking-widest mb-1 opacity-70">Date</p>
                                <p className="text-lg">{data.date}</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-widest mb-1 opacity-70">Reference</p>
                                <p className="text-lg">{data.refNumber}</p>
                            </div>
                        </div>
                    </div>
                </PageSheet>
            );
        }

        // 21. AURORA (Nature but Dark Purple/Gradient)
        if (data.coverStyle === 'aurora') {
            return (
                <PageSheet>
                    <div className="flex-1 flex flex-col p-16 relative overflow-hidden text-white bg-slate-900">
                        {/* Deep Gradient Background */}
                        <div className="absolute inset-0 z-0 bg-gradient-to-br from-violet-900 via-purple-900 to-slate-900"></div>

                        {/* Aurora-like Waves */}
                        <div className="absolute bottom-0 left-0 w-full h-[60%] z-0 opacity-40"
                            style={{ background: 'linear-gradient(to top right, #c084fc, transparent)' }}></div>
                        <div className="absolute top-0 right-0 w-[80%] h-[80%] rounded-full blur-3xl opacity-20 bg-fuchsia-500"></div>

                        <div className="relative z-10 flex justify-between items-center mb-32">
                            {data.logo ? <img src={data.logo} className="h-12 w-auto brightness-0 invert opacity-90" alt="Logo" /> : <span className="font-light tracking-wider text-2xl">High Point</span>}
                        </div>

                        <div className="relative z-10 max-w-3xl">
                            <div className="inline-block px-4 py-1 mb-6 rounded-full border border-violet-400/30 bg-violet-500/10 backdrop-blur-md text-xs font-medium tracking-widest uppercase text-violet-200">
                                Strategic Proposal
                            </div>
                            <h1 className="text-7xl font-bold leading-tight mb-8 text-transparent bg-clip-text bg-gradient-to-r from-white via-violet-100 to-violet-300">
                                {data.title}
                            </h1>
                            <p className="text-2xl font-light text-violet-200">
                                Prepared for {data.clientCompany}
                            </p>
                        </div>

                        <div className="relative z-10 mt-auto border-t border-white/20 pt-8 flex justify-between text-sm text-violet-100/80">
                            <div>
                                <p className="font-semibold text-white mb-1">Timeline</p>
                                <p>{data.date} — {data.validUntil}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-semibold text-white mb-1">Document Ref</p>
                                <p className="font-mono">{data.refNumber}</p>
                            </div>
                        </div>
                    </div>
                </PageSheet>
            );
        }

        // 22. MIDNIGHT GRADIENT
        if (data.coverStyle === 'midnight-gradient') {
            return (
                <PageSheet>
                    <div className="flex-1 flex flex-col p-16 relative text-white bg-black">
                        <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a] via-[#1e1b4b] to-black"></div>
                        <div className="relative z-10 flex-1 flex flex-col justify-center items-center text-center">
                            <div className="mb-12 w-24 h-24 rounded-full border border-white/10 flex items-center justify-center backdrop-blur-md">
                                {data.logo ? <img src={data.logo} className="h-12 w-auto brightness-0 invert" alt="Logo" /> : <Hexagon size={48} className="text-violet-400" />}
                            </div>
                            <h1 className="text-6xl font-bold mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-200 via-violet-200 to-pink-200">
                                {data.title}
                            </h1>
                            <p className="text-xl text-slate-400 font-light max-w-xl mx-auto">
                                Prepared exclusively for {data.clientCompany}
                            </p>
                        </div>
                        <div className="relative z-10 flex justify-between items-end border-t border-white/10 pt-8">
                            <div className="text-sm text-slate-500">{data.date}</div>
                            <div className="text-sm text-slate-500">{data.refNumber}</div>
                        </div>
                    </div>
                </PageSheet>
            );
        }

        // 23. ART DECO
        if (data.coverStyle === 'art-deco') {
            return (
                <PageSheet>
                    <div className="flex-1 bg-[#1a1a1a] p-8 border-8 border-[#1a1a1a]">
                        <div className="h-full border-4 border-[#D4AF37] relative flex flex-col items-center justify-center p-12 text-[#D4AF37]">
                            {/* Corner patterns */}
                            <div className="absolute top-4 left-4 w-16 h-16 border-t-2 border-l-2 border-[#D4AF37]"></div>
                            <div className="absolute top-4 right-4 w-16 h-16 border-t-2 border-r-2 border-[#D4AF37]"></div>
                            <div className="absolute bottom-4 left-4 w-16 h-16 border-b-2 border-l-2 border-[#D4AF37]"></div>
                            <div className="absolute bottom-4 right-4 w-16 h-16 border-b-2 border-r-2 border-[#D4AF37]"></div>

                            <div className="mb-16">
                                {data.logo ? <img src={data.logo} className="h-20 w-auto brightness-0 sepia-[100%] hue-rotate-[5deg] saturate-[400%]" alt="Logo" /> : <div className="text-3xl font-serif tracking-[0.2em]">HIGH POINT</div>}
                            </div>

                            <h1 className="text-5xl font-serif uppercase tracking-[0.1em] text-center leading-tight mb-8">
                                {data.title}
                            </h1>

                            <div className="w-24 h-24 border border-[#D4AF37] rotate-45 flex items-center justify-center mb-8">
                                <div className="w-16 h-16 border border-[#D4AF37]"></div>
                            </div>

                            <p className="text-xl font-light uppercase tracking-widest">
                                For {data.clientCompany}
                            </p>
                        </div>
                    </div>
                </PageSheet>
            );
        }

        // 24. NEWSPAPER
        if (data.coverStyle === 'newspaper') {
            return (
                <PageSheet>
                    <div className="flex-1 bg-[#f0f0f0] p-12 flex flex-col text-black font-serif">
                        <div className="border-b-4 border-black pb-4 mb-4 flex justify-between items-end">
                            <div className="text-6xl font-black font-serif tracking-tighter">THE PROPOSAL</div>
                            <div className="text-right text-sm font-sans font-bold">
                                <div>VOL. {data.version}</div>
                                <div>{data.date}</div>
                            </div>
                        </div>
                        <div className="border-b border-black mb-12"></div>

                        <div className="flex-1 grid grid-cols-12 gap-8">
                            <div className="col-span-8 pr-8 border-r border-gray-300">
                                <h1 className="text-7xl font-bold leading-[0.9] mb-8">
                                    {data.title}
                                </h1>
                                <p className="text-2xl italic font-serif leading-relaxed text-gray-700">
                                    A comprehensive strategy outlined for {data.clientCompany}, detailing the scope, methodology, and investment required for success.
                                </p>
                            </div>
                            <div className="col-span-4 flex flex-col justify-between">
                                <div className="bg-gray-800 text-white p-6">
                                    <h3 className="font-sans font-bold uppercase text-sm mb-2 text-gray-400">Client Profile</h3>
                                    <p className="text-xl font-bold mb-1">{data.clientCompany}</p>
                                    <p>{data.clientName}</p>
                                </div>
                                <div className="text-center border-t border-b border-black py-4 my-4">
                                    {data.logo ? <img src={data.logo} className="h-16 w-auto mx-auto grayscale" alt="Logo" /> : <div className="text-xl font-bold">HIGH POINT</div>}
                                </div>
                                <div className="font-sans text-xs text-gray-500">
                                    <p className="uppercase font-bold mb-1">Reference Code</p>
                                    <p className="font-mono">{data.refNumber}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </PageSheet>
            );
        }

        // 25. TERMINAL
        if (data.coverStyle === 'terminal') {
            return (
                <PageSheet>
                    <div className="flex-1 bg-black p-16 font-mono text-green-500 flex flex-col relative">
                        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-10 bg-[linear-gradient(rgba(18,255,0,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,6px_100%]"></div>

                        <div className="mb-8">
                            <p>&gt; INITIALIZING PROPOSAL SEQUENCE...</p>
                            <p>&gt; LOAD CLIENT_DATA: "{data.clientCompany}"</p>
                            <p>&gt; SUCCESS.</p>
                        </div>

                        <div className="flex-1 flex flex-col justify-center">
                            <h1 className="text-5xl font-bold mb-8 leading-tight">
                                <span className="text-green-700 mr-4">root@highpoint:~$</span>
                                {data.title}<span className="animate-pulse">_</span>
                            </h1>

                            <div className="border border-green-800 p-6 bg-green-900/10 max-w-xl">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>Target:</div>
                                    <div className="text-white">{data.clientCompany}</div>
                                    <div>Contact:</div>
                                    <div className="text-white">{data.clientName}</div>
                                    <div>Valid Until:</div>
                                    <div className="text-white">{data.validUntil}</div>
                                </div>
                            </div>
                        </div>

                        <div className="text-xs text-green-800 mt-auto">
                            ID: {data.refNumber} // SYSTEM V{data.version}.0
                        </div>
                    </div>
                </PageSheet>
            );
        }

        // 26. BRUSH STROKE
        if (data.coverStyle === 'brush-stroke') {
            return (
                <PageSheet>
                    <div className="flex-1 bg-white p-16 flex flex-col justify-center relative overflow-hidden">
                        {/* Simulated brush strokes */}
                        <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[40%] bg-blue-500/10 -rotate-6 transform origin-bottom-left"></div>
                        <div className="absolute bottom-[10%] right-[-10%] w-[120%] h-[30%] bg-pink-500/10 -rotate-3 transform origin-top-right"></div>

                        <div className="relative z-10 text-center">
                            {data.logo ? <img src={data.logo} className="h-20 w-auto mx-auto mb-12" alt="Logo" /> : <div className="text-3xl font-bold mb-12 text-gray-800">HP.</div>}

                            <div className="inline-block relative mb-8">
                                <div className="absolute inset-0 bg-yellow-200 -skew-x-12 transform scale-110 opacity-50"></div>
                                <h1 className="relative text-6xl font-black text-gray-900 leading-tight px-4">
                                    {data.title}
                                </h1>
                            </div>

                            <p className="text-xl text-gray-500 mt-8 font-medium">
                                Prepared for {data.clientCompany}
                            </p>
                        </div>
                    </div>
                </PageSheet>
            );
        }

        // 27. MONDRIAN
        if (data.coverStyle === 'mondrian') {
            return (
                <PageSheet>
                    <div className="flex-1 bg-white border-[12px] border-black grid grid-cols-12 grid-rows-6 h-full">
                        {/* Header Block */}
                        <div className="col-span-8 row-span-2 border-r-[12px] border-b-[12px] border-black p-8 flex items-center bg-white">
                            <h1 className="text-6xl font-bold leading-none">{data.title}</h1>
                        </div>

                        {/* Red Block */}
                        <div className="col-span-4 row-span-2 bg-[#ff0000] border-b-[12px] border-black"></div>

                        {/* Blue Block */}
                        <div className="col-span-3 row-span-3 bg-[#0000ff] border-r-[12px] border-b-[12px] border-black"></div>

                        {/* Client Info */}
                        <div className="col-span-9 row-span-2 border-b-[12px] border-black p-8 bg-white flex flex-col justify-center">
                            <p className="text-xs font-bold uppercase mb-2 text-gray-500">Prepared For</p>
                            <p className="text-3xl font-bold">{data.clientCompany}</p>
                        </div>

                        {/* Yellow Block */}
                        <div className="col-span-5 row-span-2 col-start-4 row-start-5 border-r-[12px] border-black bg-[#ffff00]"></div>

                        {/* Details */}
                        <div className="col-span-4 row-span-2 col-start-9 row-start-5 bg-white p-8">
                            <p className="font-bold">{data.date}</p>
                            <p className="font-mono text-sm">{data.refNumber}</p>
                        </div>
                    </div>
                </PageSheet>
            );
        }

        // 28. BLUEPRINT DARK
        if (data.coverStyle === 'blueprint-dark') {
            return (
                <PageSheet>
                    <div className="flex-1 bg-[#00509d] p-12 text-white relative font-mono">
                        {/* Grid */}
                        <div className="absolute inset-0 opacity-20 pointer-events-none"
                            style={{
                                backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
                                backgroundSize: '20px 20px'
                            }}>
                        </div>

                        <div className="h-full border-4 border-white p-8 flex flex-col justify-between relative z-10">
                            <div className="border-b-2 border-white pb-8">
                                {data.logo ? <img src={data.logo} className="h-16 w-auto brightness-0 invert" alt="Logo" /> : <h2 className="text-3xl font-bold">HIGH POINT TECH</h2>}
                            </div>

                            <div className="flex-1 flex items-center">
                                <div>
                                    <p className="text-sm mb-2 opacity-70">// PROJECT SPECIFICATION</p>
                                    <h1 className="text-6xl font-bold mb-4 uppercase">{data.title}</h1>
                                    <div className="w-24 h-1 bg-white mb-4"></div>
                                    <p className="text-xl">CLIENT: {data.clientCompany}</p>
                                </div>
                            </div>

                            <div className="border-t-2 border-white pt-8 grid grid-cols-3 text-xs">
                                <div>
                                    <span className="block opacity-50">DATE</span>
                                    <span>{data.date}</span>
                                </div>
                                <div>
                                    <span className="block opacity-50">DRAWN BY</span>
                                    <span>Admin</span>
                                </div>
                                <div className="text-right">
                                    <span className="block opacity-50">REF NO.</span>
                                    <span>{data.refNumber}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </PageSheet>
            );
        }

        // 29. WARM BOHO
        if (data.coverStyle === 'warm-boho') {
            return (
                <PageSheet>
                    <div className="flex-1 bg-[#f5ebe0] p-16 flex flex-col relative overflow-hidden text-[#5e503f]">
                        {/* Organic shapes */}
                        <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] bg-[#e3d5ca] rounded-full"></div>
                        <div className="absolute bottom-[-50px] right-[-50px] w-[500px] h-[500px] bg-[#d5bdaf] rounded-full"></div>

                        <div className="relative z-10 flex-1 flex flex-col justify-center items-center text-center">
                            <div className="mb-12">
                                {data.logo ? <img src={data.logo} className="h-16 w-auto opacity-70 sepia" alt="Logo" /> : <div className="text-2xl font-serif">High Point</div>}
                            </div>

                            <h1 className="text-5xl font-serif italic mb-6 leading-tight">
                                {data.title}
                            </h1>

                            <div className="w-12 h-12 rounded-full border border-[#5e503f] flex items-center justify-center mb-6">
                                <span className="text-lg">&</span>
                            </div>

                            <p className="text-xl font-light uppercase tracking-widest">
                                {data.clientCompany}
                            </p>
                        </div>
                    </div>
                </PageSheet>
            );
        }

        // 30. GLASSMORPHISM
        if (data.coverStyle === 'glassmorphism') {
            return (
                <PageSheet>
                    <div className="flex-1 relative flex items-center justify-center p-20 bg-gradient-to-br from-pink-200 via-purple-200 to-indigo-200">
                        {/* Orbs */}
                        <div className="absolute top-20 left-20 w-64 h-64 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
                        <div className="absolute top-20 right-20 w-64 h-64 bg-yellow-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
                        <div className="absolute bottom-20 left-40 w-64 h-64 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

                        <div className="relative z-10 bg-white/30 backdrop-blur-lg border border-white/20 p-16 rounded-3xl shadow-2xl w-full max-w-3xl text-center">
                            <div className="mb-8 flex justify-center">
                                {data.logo ? <img src={data.logo} className="h-16 w-auto" alt="Logo" /> : <span className="text-2xl font-bold text-gray-800">HP.</span>}
                            </div>
                            <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
                                {data.title}
                            </h1>
                            <p className="text-lg text-gray-700 font-medium mb-8">
                                Prepared for {data.clientCompany}
                            </p>
                            <div className="flex justify-center gap-8 text-sm text-gray-600 font-medium">
                                <span>{data.date}</span>
                                <span>•</span>
                                <span>{data.refNumber}</span>
                            </div>
                        </div>
                    </div>
                </PageSheet>
            );
        }

        // 31. MAGAZINE EDITORIAL
        if (data.coverStyle === 'magazine-editorial') {
            return (
                <PageSheet>
                    <div className="flex-1 bg-white flex flex-col relative">
                        {/* Large Image Area (simulated with gray block) */}
                        <div className="h-[60%] bg-gray-200 relative">
                            <div className="absolute bottom-8 left-8 bg-white p-8 max-w-lg shadow-lg">
                                <h1 className="text-6xl font-serif font-bold leading-none text-gray-900 mb-2">
                                    {data.title}
                                </h1>
                            </div>
                        </div>

                        <div className="flex-1 p-12 grid grid-cols-2 gap-12">
                            <div className="border-t-2 border-black pt-4">
                                <p className="text-xs font-bold uppercase tracking-widest mb-2">Prepared For</p>
                                <p className="text-3xl font-serif">{data.clientCompany}</p>
                                <p className="text-gray-500 mt-2">{data.clientName}</p>
                            </div>
                            <div className="flex flex-col justify-between">
                                <div className="text-right">
                                    {data.logo ? <img src={data.logo} className="h-12 w-auto ml-auto" alt="Logo" /> : <div className="text-xl font-bold">HIGH POINT</div>}
                                </div>
                                <div className="grid grid-cols-2 text-sm text-gray-500 gap-4">
                                    <div>
                                        <span className="block font-bold text-black uppercase text-xs">Date</span>
                                        {data.date}
                                    </div>
                                    <div>
                                        <span className="block font-bold text-black uppercase text-xs">Reference</span>
                                        {data.refNumber}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </PageSheet>
            );
        }

        // 32. CORPORATE (Default Fallback)
        return (
            <PageSheet>
                <div className="flex-1 flex flex-col relative p-16 border-[20px] border-gray-100 h-full justify-between">
                    <div className="flex justify-between items-start">
                        {data.logo ? (
                            <img src={data.logo} className="h-16 w-auto" alt="Logo" />
                        ) : (
                            <div className="font-bold text-2xl tracking-tight text-gray-800">HIGH POINT</div>
                        )}
                        <div className="text-right">
                            {/* Add color accent to date/year */}
                            <span className="block text-4xl font-light" style={{ color: color }}>
                                {new Date(data.date).getFullYear()}
                            </span>
                        </div>
                    </div>

                    {/* Dynamic border color */}
                    <div className="border-l-4 pl-8" style={{ borderColor: color }}>
                        <h1 className="text-6xl font-bold text-gray-900 mb-6 leading-none">{data.title}</h1>
                        <p className="text-2xl text-gray-500">for {data.clientCompany}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-8 text-sm text-gray-600">
                        <div>
                            <p className="font-bold text-gray-900 uppercase tracking-wider mb-2" style={{ color: color }}>Client Details</p>
                            <p className="text-lg text-gray-800">{data.clientName}</p>
                            <p>{data.clientEmail}</p>
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 uppercase tracking-wider mb-2" style={{ color: color }}>Proposal Details</p>
                            <p className="font-mono">Ref: {data.refNumber}</p>
                            <p>Valid Until: {data.validUntil || 'N/A'}</p>
                        </div>
                    </div>
                </div>
            </PageSheet>
        );
    };

    return (
        <div className={`bg-transparent w-full flex flex-col gap-8 items-center text-black ${fontClass} relative print:block print:gap-0`}>
            <style>{`
        @page {
          size: A4;
          margin: 0;
        }
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
        /* Rich Text Styles normalized for print */
        .proposal-rich-text h1 { font-size: 1.5em; font-weight: 800; margin-top: 1em; margin-bottom: 0.5em; color: #111827; }
        .proposal-rich-text h2 { font-size: 1.25em; font-weight: 700; margin-top: 1em; margin-bottom: 0.5em; color: #1f2937; }
        .proposal-rich-text h3 { font-size: 1.1em; font-weight: 600; margin-top: 0.8em; margin-bottom: 0.4em; color: #374151; }
        .proposal-rich-text p { margin-bottom: 0.8em; line-height: 1.6; color: #4b5563; }
        .proposal-rich-text ul { list-style-type: disc; margin-left: 1.5em; margin-bottom: 0.8em; }
        .proposal-rich-text ol { list-style-type: decimal; margin-left: 1.5em; margin-bottom: 0.8em; }
        .proposal-rich-text table { width: 100%; border-collapse: collapse; margin: 1em 0; font-size: 0.9em; }
        .proposal-rich-text th, .proposal-rich-text td { border: 1px solid #e5e7eb; padding: 0.6em; }
        .proposal-rich-text th { background-color: #f9fafb; font-weight: 600; text-align: left; }
        
        .writing-vertical-rl {
            writing-mode: vertical-rl;
            text-orientation: mixed;
        }
      `}</style>

            {/* 1. Cover Page */}
            <CoverPage />

            {/* 2. Content Sections */}
            {(data.stepOrder || ['executive', 'solution', 'financial', 'legal'])
                .filter(id => id !== 'branding')
                .map((id, index) => renderSectionContent(id, index + 1))}
        </div>
    );
};