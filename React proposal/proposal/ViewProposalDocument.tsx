import React from 'react';
import html2pdf from 'html2pdf.js';
import { useParams } from 'react-router-dom';
import { useProposal } from '../src/hooks/useProposals';
import { ProposalPrintTemplate } from './ProposalPrintTemplate';
import { Loader2, AlertCircle, FileText } from 'lucide-react';

export const ViewProposalDocument: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { data: proposal, isLoading, error } = useProposal(id || '');
    const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 size={40} className="animate-spin text-violet-600 mx-auto mb-4" />
                    <p className="text-gray-500">Loading proposal document...</p>
                </div>
            </div>
        );
    }

    if (error || !proposal) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle size={40} className="text-red-500 mx-auto mb-4" />
                    <p className="text-gray-700 font-medium mb-2">Proposal not found or access denied</p>
                </div>
            </div>
        );
    }

    const transformApiToFormData = (apiData: any): any => {
        const content = apiData.content ? (typeof apiData.content === 'string' ? JSON.parse(apiData.content) : apiData.content) : {};

        return {
            id: apiData.id,
            title: apiData.title || 'New Project Proposal',
            refNumber: apiData.reference || '',
            date: apiData.proposalDate || new Date().toISOString().split('T')[0],
            clientName: apiData.proposalFor || '',
            clientCompany: content.client?.company || '',
            clientEmail: content.client?.email || '',
            clientPhone: content.client?.phone || '',
            logo: content.branding?.logo || '',
            themeColor: content.branding?.themeColor || '#7c3aed',
            typography: content.branding?.typography || 'Sans',
            coverStyle: content.branding?.coverStyle || 'corporate',
            executiveSummary: content.sections?.executiveSummary || '',
            solutionScope: content.sections?.solutionScope || '',
            customSections: content.sections?.customSections || [],
            items: content.finance?.items || [],
            discount: content.finance?.discount || 0,
            discountType: content.finance?.discountType || 'percent',
            taxRate: content.finance?.taxRate || 15,
            currency: content.finance?.currency || 'SAR',
            phases: content.timeline || [],
            termsConditions: content.terms || '',
            status: apiData.status || 'DRAFT',
            type: apiData.type || 'MIXED',
            version: parseInt(apiData.version) || 1
        };
    };

    const formattedData = transformApiToFormData(proposal);

    const handleDownloadPDF = async () => {
        // @ts-ignore
        setIsGeneratingPdf(true);
        const element = document.getElementById('proposal-print-container');

        if (element) {
            const opt = {
                margin: 0,
                filename: `${formattedData.title.replace(/\s+/g, '_')}_Proposal.pdf`,
                image: { type: 'jpeg' as const, quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, logging: false },
                jsPDF: { unit: 'mm' as const, format: 'a4', orientation: 'portrait' as const },
                pagebreak: { mode: 'css' as const, avoid: '.print\\:break-after-page' }
            };

            try {
                // Set temporary document title for correct filename fallback in some browsers
                const originalTitle = document.title;
                document.title = formattedData.title.replace(/\s+/g, '_');

                await html2pdf().set(opt).from(element).save();

                document.title = originalTitle;
            } catch (err) {
                console.error('PDF generation failed:', err);
                alert('Failed to generate PDF. Falling back to print.');
                window.print();
            } finally {
                setIsGeneratingPdf(false);
            }
        } else {
            setIsGeneratingPdf(false);
        }
    };

    return (
        <div className="bg-gray-100 min-h-screen py-8 print:p-0 print:bg-white relative">
            <ProposalPrintTemplate data={formattedData} />

            {/* Floating Export Button */}
            <button
                onClick={handleDownloadPDF}
                disabled={isGeneratingPdf}
                className={`fixed bottom-8 right-8 z-50 px-6 py-3 rounded-full shadow-xl transition-all flex items-center gap-3 print:hidden hover:scale-105 active:scale-95 font-medium ${isGeneratingPdf ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-violet-600 text-white hover:bg-violet-700'}`}
            >
                {isGeneratingPdf ? <Loader2 size={20} className="animate-spin" /> : <FileText size={20} />}
                {isGeneratingPdf ? 'Generating PDF...' : 'Export PDF'}
            </button>
        </div>
    );
};
