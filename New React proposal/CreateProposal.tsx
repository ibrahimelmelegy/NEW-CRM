
import React, { useState, useEffect, useRef } from 'react';
import { 
  Save, ChevronLeft, ChevronRight, CheckCircle, 
  Palette, User, Layers, DollarSign, CheckSquare,
  Maximize2, ZoomOut, ZoomIn, Eye, EyeOff, Printer, Sparkles,
  ImageIcon, Calculator, Plus, X, Cpu, Shield, Zap, PenTool as Pen,
  FileText, Trash2, ArrowUp, ArrowDown, Download, Loader2, AlertCircle
} from 'lucide-react';
// Correcting the import path to the root types file
import { ProposalData, ProposalItem, ProposalPhase, CustomSection } from '../../types';
import { ProposalPrintTemplate } from './ProposalPrintTemplate';
import { RichTextEditor } from './RichTextEditor';

export const CreateProposal: React.FC<{
    initialData?: ProposalData,
    onSave: (data: ProposalData) => void,
    onCancel: () => void
}> = ({ initialData, onSave, onCancel }) => {
    
    const [activeStep, setActiveStep] = useState('branding');
    const [showPreview, setShowPreview] = useState(true); // Split view toggle
    const [zoom, setZoom] = useState(0.6); // Initial Zoom
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    
    // Custom Section State
    const [isAddingSection, setIsAddingSection] = useState(false);
    const [newSectionTitle, setNewSectionTitle] = useState('');
    
    const [globalMargin, setGlobalMargin] = useState<number>(0);

    const defaultStepOrder = ['branding', 'executive', 'solution', 'financial', 'legal'];

    const [formData, setFormData] = useState<ProposalData>(initialData || {
        id: Date.now(),
        refNumber: `PROP-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
        title: 'New Project Proposal',
        clientName: '',
        clientCompany: '',
        clientEmail: '',
        date: new Date().toISOString().split('T')[0],
        validUntil: '',
        status: 'Draft',
        themeColor: '#7c3aed',
        coverStyle: 'corporate',
        font: 'sans',
        introduction: '',
        objectives: '',
        scopeOfWork: '',
        methodology: '',
        phases: [],
        customSections: [],
        stepOrder: defaultStepOrder,
        currency: 'SAR',
        items: [{ id: 1, description: 'Service 1', quantity: 1, unit: 'Lumpsum', cost: 0, margin: 0, rate: 0 }],
        taxRate: 15,
        discount: 0,
        discountType: 'percent',
        paymentTerms: '50% Upfront, 50% Upon Completion.',
        termsAndConditions: '1. Valid for 30 days.\n2. Prices exclusive of VAT.',
        version: 1,
        lastModified: new Date().toISOString(),
        stepLabels: {
            branding: 'Branding & Details',
            executive: 'Executive Summary',
            solution: 'Solution & Scope',
            financial: 'Investment',
            legal: 'Terms & Legal'
        }
    });

    // Ensure stepOrder exists for legacy data
    useEffect(() => {
        if (!formData.stepOrder || formData.stepOrder.length === 0) {
            setFormData(prev => ({
                ...prev,
                stepOrder: prev.customSections && prev.customSections.length > 0 
                    ? ['branding', 'executive', 'solution', ...prev.customSections.map(s => s.id), 'financial', 'legal']
                    : defaultStepOrder
            }));
        }
    }, []);

    const handleChange = (field: keyof ProposalData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field as string]) {
            setErrors(prev => ({ ...prev, [field as string]: '' }));
        }
    };

    // Update labels for standard steps
    const handleStepLabelChange = (key: keyof typeof formData.stepLabels, value: string) => {
        setFormData(prev => ({
            ...prev,
            stepLabels: { ...prev.stepLabels, [key]: value }
        }));
    };

    // Dynamic Steps Construction based on stepOrder
    const getStepDetails = (id: string) => {
        // Standard Steps
        if (id === 'branding') return { id, label: formData.stepLabels?.branding || 'Branding & Details', icon: <Palette size={18} />, isCustom: false };
        if (id === 'executive') return { id, label: formData.stepLabels?.executive || 'Executive Summary', icon: <User size={18} />, isCustom: false };
        if (id === 'solution') return { id, label: formData.stepLabels?.solution || 'Solution & Scope', icon: <Layers size={18} />, isCustom: false };
        if (id === 'financial') return { id, label: formData.stepLabels?.financial || 'Investment', icon: <DollarSign size={18} />, isCustom: false };
        if (id === 'legal') return { id, label: formData.stepLabels?.legal || 'Terms & Legal', icon: <CheckSquare size={18} />, isCustom: false };
        
        // Custom Steps
        const custom = formData.customSections?.find(s => s.id === id);
        if (custom) return { id, label: custom.title, icon: <FileText size={18} />, isCustom: true };
        
        return { id, label: 'Unknown Step', icon: <FileText size={18} />, isCustom: false };
    };

    const orderedSteps = (formData.stepOrder || defaultStepOrder).map(id => getStepDetails(id));

    // Custom Section Handlers
    const handleAddSection = () => {
        if (!newSectionTitle.trim()) return;
        const newId = `custom-${Date.now()}`;
        const newSection: CustomSection = {
            id: newId,
            title: newSectionTitle,
            content: ''
        };
        
        // Insert at position 4 (index 3) per user request
        const newOrder = [...(formData.stepOrder || defaultStepOrder)];
        newOrder.splice(3, 0, newId);

        setFormData(prev => ({
            ...prev,
            customSections: [...(prev.customSections || []), newSection],
            stepOrder: newOrder
        }));
        setNewSectionTitle('');
        setIsAddingSection(false);
        setActiveStep(newId);
    };

    const handleUpdateCustomSection = (id: string, content: string) => {
        setFormData(prev => ({
            ...prev,
            customSections: prev.customSections.map(s => s.id === id ? { ...s, content } : s)
        }));
    };

    const handleUpdateCustomSectionTitle = (id: string, title: string) => {
        setFormData(prev => ({
            ...prev,
            customSections: prev.customSections.map(s => s.id === id ? { ...s, title } : s)
        }));
    };

    // Generic Move Handler for ANY step
    const handleMoveStep = (index: number, direction: 'up' | 'down') => {
        const newOrder = [...formData.stepOrder];
        if (direction === 'up') {
            if (index === 0) return;
            [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
        } else {
            if (index === newOrder.length - 1) return;
            [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
        }
        handleChange('stepOrder', newOrder);
    };

    // Generic Delete Handler for ANY step (except Branding)
    const handleDeleteStep = (id: string) => {
        if (id === 'branding') {
            alert("The Branding & Details section is mandatory and cannot be deleted.");
            return;
        }

        if (window.confirm('Are you sure you want to remove this section from the proposal?')) {
            setFormData(prev => ({
                ...prev,
                // Only remove from customSections array if it's actually a custom section ID
                customSections: id.startsWith('custom-') 
                    ? (prev.customSections || []).filter(s => s.id !== id) 
                    : prev.customSections,
                // Always remove from order list to hide it
                stepOrder: prev.stepOrder.filter(sId => sId !== id)
            }));
            
            // Switch back to a safe step if we deleted the active one
            if (activeStep === id) {
                setActiveStep('branding'); 
            }
        }
    };

    // Item Handlers with Margin Logic
    const handleItemChange = (id: number, field: keyof ProposalItem, value: any) => {
        const newItems = formData.items.map(item => {
            if (item.id === id) {
                const updates: any = { [field]: value };
                
                // Auto-calc logic:
                // 1. If Cost changes -> Recalculate Rate based on current Margin
                if (field === 'cost') {
                    const cost = Number(value) || 0;
                    const margin = item.margin || 0;
                    updates.rate = cost * (1 + margin / 100);
                } 
                // 2. If Margin changes -> Recalculate Rate based on Cost
                else if (field === 'margin') {
                    const margin = Number(value) || 0;
                    const cost = item.cost || 0;
                    updates.rate = cost * (1 + margin / 100);
                } 
                // 3. If Rate (Price) changes -> Recalculate Margin based on Cost (if Cost > 0)
                else if (field === 'rate') {
                    const rate = Number(value) || 0;
                    const cost = item.cost || 0;
                    if (cost > 0) {
                        updates.margin = ((rate - cost) / cost) * 100;
                    }
                }
                return { ...item, ...updates };
            }
            return item;
        });
        handleChange('items', newItems);
    };

    // Apply Global Margin to ALL items
    const applyGlobalMargin = () => {
        const newItems = formData.items.map(item => {
            const cost = item.cost || 0;
            return {
                ...item,
                margin: globalMargin,
                rate: cost * (1 + globalMargin / 100)
            };
        });
        handleChange('items', newItems);
    };

    const addItem = () => handleChange('items', [...formData.items, { id: Date.now(), description: '', quantity: 1, unit: 'Unit', cost: 0, margin: globalMargin, rate: 0 }]);
    const removeItem = (id: number) => handleChange('items', formData.items.filter(i => i.id !== id));

    // Phase Handlers
    const addPhase = () => handleChange('phases', [...formData.phases, { id: Date.now(), name: '', duration: '', deliverables: '' }]);
    const removePhase = (id: number) => handleChange('phases', formData.phases.filter(p => p.id !== id));
    const handlePhaseChange = (id: number, field: keyof ProposalPhase, value: any) => {
        handleChange('phases', formData.phases.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPDF = async () => {
        // @ts-ignore
        if (typeof window.html2pdf === 'undefined') {
            alert('PDF generation library not loaded. Please try printing to PDF instead.');
            return;
        }

        setIsGeneratingPdf(true);
        const element = document.getElementById('proposal-print-container');
        
        if (element) {
            // Temporarily show the element for capture
            const originalStyle = element.style.display;
            element.style.display = 'block';
            
            const opt = {
                margin: 0,
                filename: `${formData.title.replace(/\s+/g, '_')}_Proposal.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, logging: false },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                pagebreak: { mode: 'css', avoid: '.print\\:break-after-page' }
            };

            try {
                // @ts-ignore
                await window.html2pdf().set(opt).from(element).save();
            } catch (err) {
                console.error('PDF generation failed:', err);
                alert('Failed to generate PDF. Please use the Print option.');
            } finally {
                // Restore hidden state
                element.style.display = '';
                setIsGeneratingPdf(false);
            }
        } else {
            setIsGeneratingPdf(false);
        }
    };

    const handleZoomIn = () => setZoom(z => Math.min(1.2, z + 0.1));
    const handleZoomOut = () => setZoom(z => Math.max(0.3, z - 0.1));
    const handleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(e => console.error("Error entering fullscreen:", e));
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen().catch(e => console.error("Error exiting fullscreen:", e));
            }
        }
    };

    // Mock Logo Upload
    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                handleChange('logo', result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleClientLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                handleChange('clientLogo', result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Validation
    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.title.trim()) newErrors.title = 'Title is required';
        if (!formData.clientCompany.trim()) {
            newErrors.clientCompany = 'Client Company is required';
            // Also switch to branding tab to show error if not active
            if (activeStep !== 'branding') setActiveStep('branding');
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (validate()) {
            onSave(formData);
        } else {
            alert('Please fix the errors before saving.');
        }
    };

    // Status Workflow Color Map
    const getStatusColor = (status: string) => {
        switch(status) {
            case 'Draft': return 'bg-gray-100 text-gray-600 border-gray-200';
            case 'In Review': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'Approved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'Sent': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'Rejected': return 'bg-red-50 text-red-700 border-red-200';
            default: return 'bg-gray-100 border-gray-200';
        }
    };

    // Colors
    const colors = ['#7c3aed', '#2563eb', '#059669', '#dc2626', '#d97706', '#0f172a', '#db2777', '#0891b2'];

    // Identify current active custom section
    const activeCustomSection = formData.customSections?.find(s => s.id === activeStep);

    return (
        <div className="flex flex-col h-screen bg-slate-50 font-sans text-gray-800">
            {/* Global Print Styles - Aggressive Reset */}
            <style>{`
                @media print {
                    /* Reset all margins and sizes */
                    @page { margin: 0; size: auto; }
                    
                    /* Hide generic UI elements */
                    nav, aside, header, .print\\:hidden, .no-print {
                        display: none !important;
                    }

                    /* 
                       CRITICAL: Reset all container layout constraints.
                       If any parent has overflow:hidden or fixed height, print output clips.
                    */
                    html, body, #root {
                        height: auto !important;
                        min-height: auto !important;
                        overflow: visible !important;
                        position: static !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        display: block !important;
                    }

                    /* Reset specific Tailwind layout classes likely on parent divs */
                    .flex, .h-screen, .min-h-screen, .overflow-hidden, .overflow-y-auto, .fixed {
                        display: block !important;
                        height: auto !important;
                        overflow: visible !important;
                        position: static !important;
                    }

                    /* Ensure the Print Container is the ONLY visible thing */
                    #proposal-print-container {
                        display: block !important;
                        visibility: visible !important;
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        background: white;
                        z-index: 9999;
                    }
                    
                    /* Hide everything else explicitly if needed */
                    body > *:not(#root) { display: none !important; }
                }
            `}</style>

            {/* --- EDITOR UI (Wrapped in print:hidden to hide completely) --- */}
            <div className="flex flex-col h-full print:hidden">
                {/* --- TOP BAR --- */}
                <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/60 px-6 py-4 flex justify-between items-center z-20 shadow-sm h-18 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <button onClick={onCancel} className="p-2.5 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                            <ChevronLeft size={20} />
                        </button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl font-extrabold text-gray-900 leading-none tracking-tight">{formData.title || 'Untitled Proposal'}</h2>
                                <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full border ${getStatusColor(formData.status)}`}>
                                    {formData.status}
                                </span>
                            </div>
                            <p className="text-xs text-gray-400 font-medium mt-1 flex items-center gap-2">
                                <span>Ref: {formData.refNumber}</span>
                                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                <span>v{formData.version}.0</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden lg:flex items-center gap-2 bg-gray-100/50 rounded-lg p-1">
                            <button onClick={handleFullScreen} className="p-1.5 rounded-md hover:bg-white hover:shadow-sm transition-all text-gray-500 hover:text-gray-900" title="Full Screen"><Maximize2 size={16} /></button>
                            <button onClick={handleZoomOut} className="p-1.5 rounded-md hover:bg-white hover:shadow-sm transition-all text-gray-500 hover:text-gray-900" title="Zoom Out"><ZoomOut size={16} /></button>
                            <span className="text-xs font-bold text-gray-400 w-8 text-center">{Math.round(zoom * 100)}%</span>
                            <button onClick={handleZoomIn} className="p-1.5 rounded-md hover:bg-white hover:shadow-sm transition-all text-gray-500 hover:text-gray-900" title="Zoom In"><ZoomIn size={16} /></button>
                        </div>

                        <div className="h-8 w-px bg-gray-200 mx-1"></div>

                        {/* Preview Toggle */}
                        <button 
                            onClick={() => setShowPreview(!showPreview)} 
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${showPreview ? 'bg-violet-50 text-violet-700 border border-violet-100 shadow-violet-100' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                        >
                            {showPreview ? <Eye size={16} /> : <EyeOff size={16} />} 
                            {showPreview ? 'Hide Preview' : 'Show Preview'}
                        </button>

                        <button onClick={handlePrint} className="p-2.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors" title="Print/PDF">
                            <Printer size={20} />
                        </button>

                        <button 
                            onClick={handleDownloadPDF} 
                            disabled={isGeneratingPdf}
                            className="p-2.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50" 
                            title="Download PDF"
                        >
                            {isGeneratingPdf ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
                        </button>

                        <button onClick={handleSave} className="bg-gray-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-black flex items-center gap-2 shadow-lg shadow-gray-200/50 transition-all active:scale-95 hover:-translate-y-0.5">
                            <Save size={18} /> Save
                        </button>
                    </div>
                </div>

                {/* --- MAIN BUILDER AREA --- */}
                <div className="flex flex-1 overflow-hidden relative">
                    
                    {/* 1. LEFT SIDEBAR (Creative Timeline Navigation) */}
                    <div className={`w-72 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 relative z-10 transition-all duration-300 ${!showPreview ? 'w-80' : ''}`}>
                        {/* ... (sidebar content remains same) ... */}
                        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6 px-2">Proposal Steps</h3>
                            <div className="space-y-2 relative mb-6">
                                <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-gray-100 z-0"></div>
                                {orderedSteps.map((step, idx) => {
                                    const isActive = activeStep === step.id;
                                    const activeIndex = orderedSteps.findIndex(s => s.id === activeStep);
                                    const isPast = activeIndex > idx;
                                    return (
                                        <div key={step.id} className="relative z-10 flex items-center gap-2 w-full group cursor-pointer" onClick={() => setActiveStep(step.id)}>
                                            <div
                                                className={`flex-1 flex items-center gap-4 px-3 py-3 text-sm font-medium rounded-2xl transition-all ${
                                                    isActive ? 'bg-violet-50/80 text-violet-700 shadow-sm ring-1 ring-violet-100' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                                }`}
                                            >
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2 flex-shrink-0 ${
                                                    isActive ? 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-200' : 
                                                    isPast ? 'bg-violet-100 text-violet-600 border-violet-100' :
                                                    'bg-white text-gray-400 border-gray-200 group-hover:border-gray-300'
                                                }`}>
                                                    {isPast ? <CheckCircle size={14} /> : idx + 1}
                                                </div>
                                                <div className="text-left w-full truncate">
                                                    <span className="block leading-none mb-0.5 truncate">{step.label}</span>
                                                    {isActive && <span className="text-[10px] text-violet-400 font-normal animate-pulse">Editing now...</span>}
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                                <button onClick={() => handleMoveStep(idx, 'up')} disabled={idx === 0} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-violet-600 disabled:opacity-30 disabled:cursor-not-allowed"><ArrowUp size={12} /></button>
                                                <button onClick={() => handleMoveStep(idx, 'down')} disabled={idx === (orderedSteps.length - 1)} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-violet-600 disabled:opacity-30 disabled:cursor-not-allowed"><ArrowDown size={12} /></button>
                                                {step.id !== 'branding' && <button onClick={(e) => { e.stopPropagation(); handleDeleteStep(step.id); }} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={12} /></button>}
                                            </div>
                                            {step.id !== activeStep && <ChevronRight size={16} className="ml-auto text-violet-400 flex-shrink-0 opacity-0 group-hover:opacity-100" />}
                                        </div>
                                    )
                                })}
                            </div>
                            {!isAddingSection ? (
                                <button onClick={() => setIsAddingSection(true)} className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 font-bold text-xs hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50 transition-all flex items-center justify-center gap-2"><Plus size={14} /> Add Custom Section</button>
                            ) : (
                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 animate-in fade-in zoom-in-95">
                                    <label className="block text-xs font-bold text-gray-500 mb-2">New Section Name</label>
                                    <input autoFocus value={newSectionTitle} onChange={(e) => setNewSectionTitle(e.target.value)} placeholder="e.g. Portfolio" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm mb-3 focus:ring-2 focus:ring-violet-500 outline-none" onKeyDown={(e) => e.key === 'Enter' && handleAddSection()} />
                                    <div className="flex gap-2">
                                        <button onClick={handleAddSection} className="flex-1 bg-violet-600 text-white py-1.5 rounded-lg text-xs font-bold hover:bg-violet-700">Add</button>
                                        <button onClick={() => setIsAddingSection(false)} className="flex-1 bg-gray-200 text-gray-600 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-300">Cancel</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 2. MIDDLE (Editor Form - Clean & Modern) */}
                    <div className={`flex-1 overflow-y-auto bg-slate-50/50 p-8 custom-scrollbar ${showPreview ? 'max-w-[45%]' : 'max-w-full mx-auto'} transition-all duration-300`}>
                        <div className="max-w-3xl mx-auto space-y-8 pb-20">
                            
                            {/* Dynamic Custom Section Editor */}
                            {activeCustomSection && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
                                     <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/60 border border-white">
                                        <div className="flex justify-between items-center mb-6">
                                            <div className="flex-1 mr-4">
                                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Section Title</label>
                                                <input value={activeCustomSection.title} onChange={(e) => handleUpdateCustomSectionTitle(activeCustomSection.id, e.target.value)} className="text-xl font-bold text-gray-900 border-none focus:ring-0 p-0 w-full bg-transparent outline-none placeholder-gray-300" placeholder="Section Name" />
                                            </div>
                                            <button type="button" onClick={() => handleDeleteStep(activeCustomSection.id)} className="text-red-400 hover:bg-red-50 hover:text-red-600 p-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold"><Trash2 size={16}/> Delete</button>
                                        </div>
                                        <p className="text-sm text-gray-500 mb-6">Add your custom content for this section.</p>
                                        <RichTextEditor value={activeCustomSection.content} onChange={(val) => handleUpdateCustomSection(activeCustomSection.id, val)} placeholder={`Enter details for ${activeCustomSection.title}...`} className="bg-gray-50" minHeight="400px" />
                                     </div>
                                </div>
                            )}

                            {activeStep === 'branding' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
                                    <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/60 border border-white">
                                        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-violet-100 flex items-center justify-center text-violet-600"><Palette size={20} /></div>
                                            <input value={formData.stepLabels?.branding || 'Branding & Details'} onChange={(e) => handleStepLabelChange('branding', e.target.value)} className="text-xl font-bold text-gray-900 border-none focus:ring-0 bg-transparent outline-none flex-1" />
                                        </h3>
                                        
                                        <div className="space-y-8">
                                            {/* Logo Upload */}
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-3">Company Logo</label>
                                                <div className="flex items-center gap-5">
                                                    <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50/50 overflow-hidden group hover:border-violet-400 transition-colors relative">
                                                        {formData.logo ? <img src={formData.logo} alt="Logo" className="w-full h-full object-contain p-2" /> : <ImageIcon size={24} className="text-gray-300 group-hover:text-violet-400 transition-colors" />}
                                                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleLogoUpload} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <button className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors shadow-sm relative overflow-hidden"><input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleLogoUpload} />Upload New Logo</button>
                                                        <p className="text-xs text-gray-400">Recommended size: 200x200px (PNG)</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-8">
                                                {/* Colors */}
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-700 mb-4">Theme Color</label>
                                                    <div className="flex gap-3 flex-wrap">
                                                        {colors.map(c => (
                                                            <button key={c} onClick={() => handleChange('themeColor', c)} className={`w-10 h-10 rounded-full transition-all flex items-center justify-center ${formData.themeColor === c ? 'ring-2 ring-offset-2 ring-gray-300 scale-110 shadow-md' : 'hover:scale-105'}`} style={{ backgroundColor: c }}>{formData.themeColor === c && <CheckCircle size={16} className="text-white/80" />}</button>
                                                        ))}
                                                    </div>
                                                </div>
                                                {/* Fonts */}
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-700 mb-4">Typography</label>
                                                    <div className="flex bg-gray-100 p-1.5 rounded-xl">
                                                        {['sans', 'serif', 'mono'].map(f => (
                                                            <button key={f} onClick={() => handleChange('font', f as any)} className={`flex-1 py-2 text-xs font-bold rounded-lg capitalize transition-all ${formData.font === f ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>{f}</button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Cover Style */}
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-4">Cover Page Style</label>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    {[
                                                        'corporate', 'business', 'creative', 'enterprise', 'minimal', 'tech', 
                                                        'modern-art', 'geometric', 'bold-typography', 'gradient-splash', 
                                                        'swiss', 'dark-mode', 'architectural', 'abstract',
                                                        'neon-night', 'brutalist', 'nature', 'japanese-minimal', 'retro-pop', 'futuristic-grid',
                                                        'ethereal', 'aurora',
                                                        'midnight-gradient', 'art-deco', 'newspaper', 'terminal', 'brush-stroke', 'mondrian', 'blueprint-dark', 'warm-boho', 'glassmorphism', 'magazine-editorial'
                                                    ].map(style => (
                                                        <button key={style} onClick={() => handleChange('coverStyle', style as any)} className={`border-2 rounded-2xl p-3 text-left transition-all group ${formData.coverStyle === style ? 'border-violet-500 bg-violet-50/50 ring-0 shadow-lg shadow-violet-100' : 'border-transparent bg-gray-100 hover:bg-gray-100 hover:border-gray-200'}`}>
                                                            <div className={`aspect-[3/4] mb-3 rounded-xl overflow-hidden relative shadow-inner ${formData.coverStyle === style ? 'bg-white' : 'bg-gray-200'}`}>
                                                                {/* Mini-Preview Content */}
                                                                {style === 'business' && (<div className="absolute inset-0 bg-white flex flex-col"><div className="h-2/3 bg-white"></div><div className="h-1/3 bg-slate-800"></div></div>)}
                                                                {style === 'corporate' && (<div className="absolute inset-0 bg-white flex"><div className="w-1/3 h-full bg-slate-800"></div><div className="w-2/3 h-full bg-white"></div></div>)}
                                                                {style === 'creative' && (<div className="absolute inset-0 bg-white"><div className="absolute top-0 right-0 w-full h-full bg-slate-800" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 80%, 0 100%)' }}></div><div className="absolute bottom-10 left-4 w-12 h-1 bg-violet-500"></div></div>)}
                                                                {style === 'enterprise' && (<div className="absolute inset-0 bg-white flex flex-col"><div className="h-12 bg-slate-900"></div><div className="flex-1 border-4 border-slate-900 m-4"></div></div>)}
                                                                {style === 'minimal' && (<div className="absolute inset-0 bg-white items-center justify-center flex"><div className="w-12 h-1 bg-slate-900"></div></div>)}
                                                                {style === 'tech' && (<div className="absolute inset-0 bg-slate-900 flex items-center justify-center"><div className="w-full h-px bg-green-500"></div></div>)}
                                                                {style === 'modern-art' && (
                                                                    <div className="absolute inset-0 bg-white overflow-hidden">
                                                                        <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-violet-200 opacity-50"></div>
                                                                        <div className="absolute top-10 left-[-10px] w-12 h-12 rounded-full bg-violet-600"></div>
                                                                    </div>
                                                                )}
                                                                {style === 'geometric' && (
                                                                    <div className="absolute inset-0 bg-white flex">
                                                                        <div className="w-1/3 h-full bg-slate-900 flex flex-col justify-end p-1">
                                                                            <div className="w-full h-1 bg-violet-500 mb-1"></div>
                                                                        </div>
                                                                        <div className="flex-1 p-2">
                                                                            <div className="w-8 h-8 border-2 border-violet-500"></div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {style === 'bold-typography' && (
                                                                    <div className="absolute inset-0 bg-white flex flex-col justify-center px-2">
                                                                        <div className="w-2 h-full absolute left-0 top-0 bg-slate-900"></div>
                                                                        <div className="h-2 w-12 bg-violet-500 mb-2"></div>
                                                                        <div className="h-4 w-full bg-slate-800 mb-1"></div>
                                                                        <div className="h-4 w-2/3 bg-slate-800"></div>
                                                                    </div>
                                                                )}
                                                                {style === 'gradient-splash' && (
                                                                    <div className="absolute inset-0 bg-white">
                                                                        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-b-3xl"></div>
                                                                    </div>
                                                                )}
                                                                {style === 'swiss' && (
                                                                    <div className="absolute inset-0 bg-white p-2 flex flex-col justify-between">
                                                                        <div className="w-full h-px bg-black"></div>
                                                                        <div className="flex-1 mt-2">
                                                                            <div className="h-4 w-16 bg-black mb-1"></div>
                                                                            <div className="h-4 w-10 bg-red-600"></div>
                                                                        </div>
                                                                        <div className="w-full h-px bg-black"></div>
                                                                    </div>
                                                                )}
                                                                {style === 'dark-mode' && (
                                                                    <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center">
                                                                        <div className="w-10 h-10 rounded-full border border-violet-500 mb-2 shadow-[0_0_10px_rgba(124,58,237,0.5)]"></div>
                                                                        <div className="h-1 w-12 bg-violet-500"></div>
                                                                    </div>
                                                                )}
                                                                {style === 'architectural' && (
                                                                    <div className="absolute inset-0 bg-white p-2" style={{ backgroundImage: 'radial-gradient(#ccc 1px, transparent 1px)', backgroundSize: '10px 10px' }}>
                                                                        <div className="border border-blue-900 h-full w-full flex flex-col justify-end p-2">
                                                                            <div className="w-full h-8 border-t border-blue-900"></div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {style === 'abstract' && (
                                                                    <div className="absolute inset-0 bg-white overflow-hidden">
                                                                        <div className="absolute top-[-20%] left-[-20%] w-[100%] h-[100%] rounded-full bg-violet-100"></div>
                                                                        <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[80%] rounded-full bg-violet-50"></div>
                                                                        <div className="absolute top-[40%] left-[20%] w-8 h-8 rounded-full bg-violet-400 blur-sm"></div>
                                                                    </div>
                                                                )}
                                                                {style === 'neon-night' && (
                                                                    <div className="absolute inset-0 bg-black flex flex-col justify-center items-center">
                                                                        <div className="w-16 h-1 bg-cyan-400 shadow-[0_0_8px_cyan]"></div>
                                                                        <div className="mt-2 w-10 h-1 bg-pink-500 shadow-[0_0_8px_magenta]"></div>
                                                                    </div>
                                                                )}
                                                                {style === 'brutalist' && (
                                                                    <div className="absolute inset-0 bg-stone-200 p-2">
                                                                        <div className="border-4 border-black h-full w-full flex items-center justify-center">
                                                                            <div className="bg-black text-white px-2 py-1 text-[8px] font-bold uppercase">Proposal</div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {style === 'nature' && (
                                                                    <div className="absolute inset-0 bg-[#fdfcf0] flex flex-col justify-end">
                                                                        <div className="h-16 w-full bg-[#e8eed9] rounded-t-full"></div>
                                                                    </div>
                                                                )}
                                                                {style === 'japanese-minimal' && (
                                                                    <div className="absolute inset-0 bg-white flex items-center justify-center">
                                                                        <div className="w-8 h-8 rounded-full bg-red-600"></div>
                                                                        <div className="absolute right-2 top-2 w-1 h-12 bg-black"></div>
                                                                    </div>
                                                                )}
                                                                {style === 'retro-pop' && (
                                                                    <div className="absolute inset-0 bg-yellow-300 p-2 overflow-hidden">
                                                                        <div className="absolute -right-4 -top-4 w-12 h-12 bg-blue-500 rounded-full border-2 border-black"></div>
                                                                        <div className="absolute bottom-2 left-2 w-full h-4 bg-pink-500 border-2 border-black transform -rotate-3"></div>
                                                                    </div>
                                                                )}
                                                                {style === 'futuristic-grid' && (
                                                                    <div className="absolute inset-0 bg-slate-900 p-1" style={{ backgroundImage: 'linear-gradient(rgba(0,255,0,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,0,0.2) 1px, transparent 1px)', backgroundSize: '10px 10px' }}>
                                                                        <div className="border border-green-500/50 h-full w-full relative">
                                                                            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-green-500"></div>
                                                                            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-green-500"></div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {style === 'ethereal' && (
                                                                    <div className="absolute inset-0 bg-white flex flex-col justify-end">
                                                                        <div className="h-12 w-full bg-violet-100 rounded-tr-[50px] opacity-70"></div>
                                                                        <div className="h-8 w-2/3 bg-violet-200 rounded-tr-[50px]"></div>
                                                                    </div>
                                                                )}
                                                                {style === 'aurora' && (
                                                                    <div className="absolute inset-0 bg-slate-900 overflow-hidden">
                                                                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-violet-900 via-purple-900 to-slate-900"></div>
                                                                        <div className="absolute bottom-[-10px] w-full h-10 bg-gradient-to-t from-violet-500/30 to-transparent blur-md"></div>
                                                                    </div>
                                                                )}
                                                                {style === 'midnight-gradient' && (
                                                                    <div className="absolute inset-0 bg-gradient-to-b from-blue-900 to-purple-900 flex flex-col items-center justify-center">
                                                                        <div className="w-12 h-12 rounded-full border border-white/20"></div>
                                                                    </div>
                                                                )}
                                                                {style === 'art-deco' && (
                                                                    <div className="absolute inset-0 bg-black border-4 border-[#D4AF37] flex items-center justify-center">
                                                                        <div className="w-16 h-16 border border-[#D4AF37] transform rotate-45"></div>
                                                                    </div>
                                                                )}
                                                                {style === 'newspaper' && (
                                                                    <div className="absolute inset-0 bg-[#f0f0f0] p-2 flex flex-col">
                                                                        <div className="w-full h-2 bg-black mb-1"></div>
                                                                        <div className="flex gap-1 flex-1">
                                                                            <div className="w-1/3 bg-gray-300"></div>
                                                                            <div className="w-2/3 bg-gray-200"></div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {style === 'terminal' && (
                                                                    <div className="absolute inset-0 bg-black p-2 font-mono text-[8px] text-green-500">
                                                                        &gt; INIT...<br/>&gt; LOAD
                                                                    </div>
                                                                )}
                                                                {style === 'brush-stroke' && (
                                                                    <div className="absolute inset-0 bg-white flex items-center justify-center">
                                                                        <div className="w-20 h-8 bg-red-200 -skew-x-12 rounded-sm"></div>
                                                                    </div>
                                                                )}
                                                                {style === 'mondrian' && (
                                                                    <div className="absolute inset-0 bg-white border-2 border-black grid grid-cols-2 grid-rows-2">
                                                                        <div className="bg-red-600 border-r-2 border-b-2 border-black"></div>
                                                                        <div className="bg-white border-b-2 border-black"></div>
                                                                        <div className="bg-yellow-400 border-r-2 border-black"></div>
                                                                        <div className="bg-blue-600"></div>
                                                                    </div>
                                                                )}
                                                                {style === 'blueprint-dark' && (
                                                                    <div className="absolute inset-0 bg-[#00509d] p-1" style={{backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '10px 10px'}}>
                                                                        <div className="border border-white w-full h-full"></div>
                                                                    </div>
                                                                )}
                                                                {style === 'warm-boho' && (
                                                                    <div className="absolute inset-0 bg-[#e3d5ca] flex items-center justify-center">
                                                                        <div className="w-16 h-16 rounded-full bg-[#d5bdaf]"></div>
                                                                    </div>
                                                                )}
                                                                {style === 'glassmorphism' && (
                                                                    <div className="absolute inset-0 bg-gradient-to-r from-pink-300 to-purple-300 flex items-center justify-center">
                                                                        <div className="w-20 h-12 bg-white/30 backdrop-blur-sm border border-white/50 rounded-lg"></div>
                                                                    </div>
                                                                )}
                                                                {style === 'magazine-editorial' && (
                                                                    <div className="absolute inset-0 bg-white">
                                                                        <div className="h-1/2 bg-gray-200"></div>
                                                                        <div className="p-2">
                                                                            <div className="h-4 w-4 bg-black text-white text-[8px] flex items-center justify-center font-bold">M</div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <span className={`text-xs font-bold capitalize block text-center ${formData.coverStyle === style ? 'text-violet-700' : 'text-gray-500'}`}>{style.replace('-', ' ')}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/60 border border-white">
                                        <h3 className="text-xl font-bold text-gray-900 mb-6">Document & Client Details</h3>
                                        <div className="grid grid-cols-12 gap-6">
                                            {/* ... form content ... */}
                                            <div className="col-span-12">
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Proposal Title <span className="text-red-500">*</span></label>
                                                <input value={formData.title} onChange={(e) => handleChange('title', e.target.value)} className={`w-full px-5 py-4 bg-gray-50 border-2 ${errors.title ? 'border-red-500' : 'border-transparent'} rounded-2xl focus:bg-white focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 outline-none font-bold text-lg transition-all`} placeholder="e.g. Digital Transformation Roadmap" />
                                                {errors.title && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.title}</p>}
                                            </div>
                                            <div className="col-span-6 md:col-span-4">
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Reference ID</label>
                                                <input value={formData.refNumber} onChange={(e) => handleChange('refNumber', e.target.value)} className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-violet-500 outline-none font-mono text-sm transition-all" />
                                            </div>
                                            <div className="col-span-6 md:col-span-4">
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Version</label>
                                                <div className="flex items-center">
                                                    <span className="bg-gray-100 border border-r-0 border-transparent px-4 py-3 rounded-l-xl text-gray-500 text-sm font-bold">v</span>
                                                    <input type="number" value={formData.version} onChange={(e) => handleChange('version', parseFloat(e.target.value))} className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-r-xl focus:bg-white focus:border-violet-500 outline-none font-bold transition-all" />
                                                </div>
                                            </div>
                                            <div className="col-span-6 md:col-span-4">
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Date</label>
                                                <input type="date" value={formData.date} onChange={(e) => handleChange('date', e.target.value)} className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-violet-500 outline-none text-sm font-medium transition-all" />
                                            </div>

                                            <div className="col-span-12 pt-6 mt-4 border-t border-gray-100 bg-violet-50/50 p-6 rounded-2xl border border-violet-100">
                                                <h4 className="text-sm font-bold text-violet-800 mb-4 flex items-center gap-2"><User size={16}/> Client Information (Prepared For)</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Client Company <span className="text-red-500">*</span></label>
                                                        <input value={formData.clientCompany} onChange={(e) => handleChange('clientCompany', e.target.value)} placeholder="Company Name" className={`w-full px-4 py-3 bg-white border-2 ${errors.clientCompany ? 'border-red-500' : 'border-transparent'} rounded-xl focus:border-violet-500 outline-none text-sm font-bold text-gray-800 transition-all shadow-sm`} />
                                                        {errors.clientCompany && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.clientCompany}</p>}
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Contact Name</label>
                                                        <input value={formData.clientName} onChange={(e) => handleChange('clientName', e.target.value)} placeholder="Contact Person" className="w-full px-4 py-3 bg-white border-2 border-transparent rounded-xl focus:border-violet-500 outline-none text-sm font-bold text-gray-800 transition-all shadow-sm" />
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Contact Email</label>
                                                        <input value={formData.clientEmail} onChange={(e) => handleChange('clientEmail', e.target.value)} placeholder="email@company.com" className="w-full px-4 py-3 bg-white border-2 border-transparent rounded-xl focus:border-violet-500 outline-none text-sm font-medium transition-all shadow-sm" />
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="col-span-12 border-t border-gray-100 pt-6 mt-2">
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-4">Client Branding (Optional)</label>
                                                <div className="flex items-center gap-5 p-4 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50 hover:bg-white hover:border-violet-300 transition-all group">
                                                    <div className="w-14 h-14 rounded-xl bg-white shadow-sm flex items-center justify-center overflow-hidden">
                                                        {formData.clientLogo ? <img src={formData.clientLogo} alt="Client Logo" className="w-full h-full object-contain p-2" /> : <ImageIcon size={20} className="text-gray-300" />}
                                                    </div>
                                                    <div>
                                                        <label className="cursor-pointer text-sm font-bold text-gray-700 hover:text-violet-600 transition-colors inline-block">
                                                            Upload Client Logo
                                                            <input type="file" className="hidden" accept="image/*" onChange={handleClientLogoUpload} />
                                                        </label>
                                                        <p className="text-[10px] text-gray-400 mt-1">Logo will appear on the cover page for personalization.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeStep === 'executive' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
                                    <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/60 border border-white">
                                        <div className="flex justify-between items-center mb-2">
                                            <h3 className="text-xl font-bold text-gray-900 flex-1">
                                                <input value={formData.stepLabels?.executive || 'Executive Summary'} onChange={(e) => handleStepLabelChange('executive', e.target.value)} className="font-bold text-gray-900 border-none focus:ring-0 bg-transparent outline-none w-full" />
                                            </h3>
                                            <button type="button" onClick={() => handleDeleteStep('executive')} className="text-red-300 hover:bg-red-50 hover:text-red-500 p-2 rounded-lg transition-colors" title="Delete Section"><Trash2 size={18}/></button>
                                        </div>
                                        <p className="text-sm text-gray-500 mb-6">A high-level overview of the proposal.</p>
                                        <RichTextEditor value={formData.introduction} onChange={(val) => handleChange('introduction', val)} placeholder="We are pleased to submit this proposal..." className="bg-gray-50" minHeight="250px" />
                                    </div>
                                    <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/60 border border-white">
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">Key Objectives</h3>
                                        <p className="text-sm text-gray-500 mb-6">What will this project achieve?</p>
                                        <RichTextEditor value={formData.objectives} onChange={(val) => handleChange('objectives', val)} placeholder="1. Increase operational efficiency..." className="bg-gray-50" minHeight="200px" />
                                    </div>
                                </div>
                            )}

                            {activeStep === 'solution' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
                                    <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/60 border border-white">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-xl font-bold text-gray-900 flex-1"><input value={formData.stepLabels?.solution || 'Solution & Scope'} onChange={(e) => handleStepLabelChange('solution', e.target.value)} className="font-bold text-gray-900 border-none focus:ring-0 bg-transparent outline-none w-full" /></h3>
                                            <button type="button" onClick={() => handleDeleteStep('solution')} className="text-red-300 hover:bg-red-50 hover:text-red-500 p-2 rounded-lg transition-colors" title="Delete Section"><Trash2 size={18}/></button>
                                        </div>
                                        <RichTextEditor value={formData.scopeOfWork} onChange={(val) => handleChange('scopeOfWork', val)} className="bg-gray-50" minHeight="400px" />
                                    </div>
                                    <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/60 border border-white">
                                        <h3 className="text-xl font-bold text-gray-900 mb-6">Methodology</h3>
                                        <RichTextEditor value={formData.methodology} onChange={(val) => handleChange('methodology', val)} className="bg-gray-50" minHeight="250px" />
                                    </div>
                                    <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/60 border border-white">
                                        <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-gray-900">Project Phases</h3><button onClick={addPhase} className="text-violet-600 hover:bg-violet-50 px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2"><Plus size={16} /> Add Phase</button></div>
                                        <div className="space-y-4">
                                            {formData.phases.map((phase) => (
                                                <div key={phase.id} className="p-6 border border-gray-100 rounded-2xl bg-gray-50/30 relative group hover:border-violet-200 transition-all">
                                                    <button onClick={() => removePhase(phase.id)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2 bg-white rounded-lg shadow-sm"><X size={16}/></button>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <input value={phase.name} onChange={(e) => handlePhaseChange(phase.id, 'name', e.target.value)} placeholder="Phase Name" className="bg-white border-2 border-transparent p-3 rounded-xl text-sm font-bold focus:border-violet-500 outline-none transition-all" />
                                                        <input value={phase.duration} onChange={(e) => handlePhaseChange(phase.id, 'duration', e.target.value)} placeholder="Duration" className="bg-white border-2 border-transparent p-3 rounded-xl text-sm font-medium focus:border-violet-500 outline-none transition-all" />
                                                        <input value={phase.deliverables} onChange={(e) => handlePhaseChange(phase.id, 'deliverables', e.target.value)} placeholder="Deliverables" className="col-span-2 bg-white border-2 border-transparent p-3 rounded-xl text-sm text-gray-600 focus:border-violet-500 outline-none transition-all" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeStep === 'financial' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
                                    <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/60 border border-white">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-xl font-bold text-gray-900 flex-1"><input value={formData.stepLabels?.financial || 'Investment'} onChange={(e) => handleStepLabelChange('financial', e.target.value)} className="font-bold text-gray-900 border-none focus:ring-0 bg-transparent outline-none w-full" /></h3>
                                            <button type="button" onClick={() => handleDeleteStep('financial')} className="text-red-300 hover:bg-red-50 hover:text-red-500 p-2 rounded-lg transition-colors" title="Delete Section"><Trash2 size={18}/></button>
                                        </div>
                                        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-6 mb-8 shadow-lg shadow-violet-200 text-white flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm"><Calculator size={24} className="text-white" /></div>
                                                <div><h4 className="text-base font-bold text-white">Profitability Tuner</h4><p className="text-xs text-violet-100 opacity-80">Adjust margin for all items instantly.</p></div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center bg-white/10 border border-white/20 rounded-xl overflow-hidden backdrop-blur-sm">
                                                    <input type="number" value={globalMargin} onChange={(e) => setGlobalMargin(parseFloat(e.target.value))} className="w-20 p-3 text-lg font-bold text-center outline-none bg-transparent text-white placeholder-white/50" placeholder="0" />
                                                    <span className="pr-4 text-sm font-bold text-white/70">%</span>
                                                </div>
                                                <button onClick={applyGlobalMargin} className="bg-white text-violet-700 px-5 py-3 rounded-xl text-xs font-bold hover:bg-violet-50 transition-colors shadow-sm">Apply</button>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center mb-6 px-2"><h3 className="text-xl font-bold text-gray-900">Pricing Table</h3><button onClick={addItem} className="bg-gray-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-black transition-all flex items-center gap-2"><Plus size={16} /> Add Item</button></div>
                                        <div className="overflow-hidden rounded-xl border border-gray-100">
                                            <table className="w-full text-left">
                                                <thead className="bg-gray-50/80">
                                                    <tr className="text-xs text-gray-500 uppercase tracking-wider"><th className="py-4 pl-6 font-bold">Description</th><th className="py-4 w-20 text-center font-bold">Unit</th><th className="py-4 w-20 text-center font-bold">Qty</th><th className="py-4 w-28 text-right font-bold text-gray-400">Cost</th><th className="py-4 w-24 text-right font-bold text-blue-600">Margin</th><th className="py-4 w-28 text-right font-bold">Price</th><th className="py-4 w-28 text-right font-bold">Total</th><th className="py-4 w-10"></th></tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {formData.items.map(item => (
                                                        <tr key={item.id} className="group hover:bg-gray-50/50 transition-colors">
                                                            <td className="py-3 pl-4"><input value={item.description} onChange={(e) => handleItemChange(item.id, 'description', e.target.value)} className="w-full bg-transparent outline-none text-sm p-2 rounded-lg focus:bg-white focus:ring-2 focus:ring-violet-100 font-medium" placeholder="Item name" /></td>
                                                            <td className="py-3"><input value={item.unit} onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)} className="w-full bg-transparent outline-none text-sm p-2 text-center text-gray-500" /></td>
                                                            <td className="py-3"><input type="number" value={item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value))} className="w-full bg-transparent outline-none text-sm p-2 text-center font-bold" /></td>
                                                            <td className="py-3"><div className="relative mx-2"><input type="number" value={item.cost || 0} onChange={(e) => handleItemChange(item.id, 'cost', parseFloat(e.target.value))} className="w-full bg-gray-100/50 rounded-lg border-none outline-none text-xs p-2 text-right text-gray-500 font-mono focus:ring-2 focus:ring-gray-200 transition-all" /></div></td>
                                                            <td className="py-3"><div className="relative mx-2"><input type="number" value={item.margin !== undefined ? Number(item.margin).toFixed(1) : 0} onChange={(e) => handleItemChange(item.id, 'margin', parseFloat(e.target.value))} className="w-full bg-blue-50/50 rounded-lg border-none outline-none text-xs p-2 text-right text-blue-600 font-bold focus:ring-2 focus:ring-blue-100 transition-all" /></div></td>
                                                            <td className="py-3"><input type="number" value={item.rate !== undefined ? Number(item.rate).toFixed(2) : 0} onChange={(e) => handleItemChange(item.id, 'rate', parseFloat(e.target.value))} className="w-full bg-transparent outline-none text-sm p-2 text-right font-bold text-gray-900" /></td>
                                                            <td className="py-3 text-right text-sm font-extrabold text-gray-800 pr-4">{(item.quantity * item.rate).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                                            <td className="py-3 text-center"><button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 transition-all"><X size={14}/></button></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <div className="mt-8 pt-8 border-t border-gray-100 flex justify-end">
                                            <div className="w-72 space-y-4 bg-gray-50/50 p-6 rounded-2xl">
                                                <div className="flex justify-between items-center text-sm"><span className="text-gray-500 font-medium">Tax Rate (%)</span><input type="number" value={formData.taxRate} onChange={(e) => handleChange('taxRate', parseFloat(e.target.value))} className="w-20 text-right bg-white border border-gray-200 rounded-lg p-1.5 text-sm font-bold focus:border-violet-500 outline-none" /></div>
                                                <div className="flex justify-between items-center text-sm"><span className="text-gray-500 font-medium">Discount</span><div className="flex gap-2"><select value={formData.discountType} onChange={(e) => handleChange('discountType', e.target.value)} className="text-xs border border-gray-200 rounded-lg bg-white px-1 outline-none"><option value="percent">%</option><option value="fixed">$</option></select><input type="number" value={formData.discount} onChange={(e) => handleChange('discount', parseFloat(e.target.value))} className="w-20 text-right bg-white border border-gray-200 rounded-lg p-1.5 text-sm font-bold focus:border-violet-500 outline-none" /></div></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeStep === 'legal' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
                                    <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/60 border border-white">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-xl font-bold text-gray-900 flex-1"><input value={formData.stepLabels?.legal || 'Terms & Legal'} onChange={(e) => handleStepLabelChange('legal', e.target.value)} className="font-bold text-gray-900 border-none focus:ring-0 bg-transparent outline-none w-full" /></h3>
                                            <button type="button" onClick={() => handleDeleteStep('legal')} className="text-red-300 hover:bg-red-50 hover:text-red-500 p-2 rounded-lg transition-colors" title="Delete Section"><Trash2 size={18}/></button>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-700 mb-4">Payment Terms</h3>
                                        <RichTextEditor value={formData.paymentTerms} onChange={(val) => handleChange('paymentTerms', val)} minHeight="150px" />
                                    </div>
                                    <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/60 border border-white">
                                        <h3 className="text-lg font-bold text-gray-700 mb-4">Terms & Conditions</h3>
                                        <RichTextEditor value={formData.termsAndConditions} onChange={(val) => handleChange('termsAndConditions', val)} minHeight="250px" />
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>

                    {/* 3. RIGHT (Live Preview - Only visible if showPreview is true) */}
                    {showPreview && (
                        <div className="flex-1 bg-slate-100 overflow-y-auto flex flex-col items-center p-12 relative print:hidden border-l border-gray-200/50 shadow-inner" 
                             style={{ 
                                 backgroundImage: 'radial-gradient(#cbd5e1 1.5px, transparent 1.5px)', 
                                 backgroundSize: '24px 24px' 
                             }}>
                            <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', paddingBottom: '100px' }} className="transition-transform duration-200">
                                <ProposalPrintTemplate data={formData} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Hidden Print Area - Only visible during print via global styles */}
            <div id="proposal-print-container" className="hidden print:block">
                <ProposalPrintTemplate data={formData} />
            </div>
        </div>
    );
}