import React from 'react';
import { useParams } from 'react-router-dom';
import { useProposal } from '../src/hooks/useProposals';
import { ProposalPrintTemplate } from './ProposalPrintTemplate';
import { Loader2, AlertCircle } from 'lucide-react';

export const ViewProposalDocument: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { data: proposal, isLoading, error } = useProposal(id || '');

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

    return (
        <div className="bg-gray-100 min-h-screen py-8 print:p-0 print:bg-white relative">
            <ProposalPrintTemplate data={formattedData} />

            {/* Floating Export Button */}
            <button
                onClick={() => window.print()}
                className="fixed bottom-8 right-8 z-50 bg-violet-600 text-white px-6 py-3 rounded-full shadow-xl hover:bg-violet-700 transition-all flex items-center gap-3 print:hidden hover:scale-105 active:scale-95 font-medium"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Export PDF / Print
            </button>
        </div>
    );
};
