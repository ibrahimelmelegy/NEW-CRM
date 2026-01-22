/**
 * CRM Entity Selector Component
 * Allows selecting an Opportunity, Deal, or Project to link with a proposal
 */

import React, { useState } from 'react';
import { Search, Building2, Briefcase, FolderKanban, ChevronDown, X, Loader2 } from 'lucide-react';
import { useCRMEntities } from '../../src/hooks/useCRMEntities';

export type EntityType = 'Opportunity' | 'Deal' | 'Project';

export interface SelectedEntity {
    type: EntityType;
    id: number;
    name: string;
    // Client data for auto-fill
    clientName?: string;
    clientCompany?: string;
    clientEmail?: string;
}

interface CRMEntitySelectorProps {
    value?: SelectedEntity | null;
    onChange: (entity: SelectedEntity | null) => void;
    disabled?: boolean;
}

export const CRMEntitySelector: React.FC<CRMEntitySelectorProps> = ({
    value,
    onChange,
    disabled = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [entityType, setEntityType] = useState<EntityType>('Opportunity');
    const [searchTerm, setSearchTerm] = useState('');

    const {
        opportunities,
        deals,
        projects,
        isLoadingOpportunities,
        isLoadingDeals,
        isLoadingProjects
    } = useCRMEntities();

    const entityTypes: { type: EntityType; icon: typeof Building2; label: string; color: string }[] = [
        { type: 'Opportunity', icon: Building2, label: 'Opportunity', color: 'text-blue-600 bg-blue-50' },
        { type: 'Deal', icon: Briefcase, label: 'Deal', color: 'text-green-600 bg-green-50' },
        { type: 'Project', icon: FolderKanban, label: 'Project', color: 'text-purple-600 bg-purple-50' },
    ];

    const getCurrentEntities = () => {
        switch (entityType) {
            case 'Opportunity':
                return opportunities || [];
            case 'Deal':
                return deals || [];
            case 'Project':
                return projects || [];
            default:
                return [];
        }
    };

    const isLoading = () => {
        switch (entityType) {
            case 'Opportunity':
                return isLoadingOpportunities;
            case 'Deal':
                return isLoadingDeals;
            case 'Project':
                return isLoadingProjects;
            default:
                return false;
        }
    };

    const filteredEntities = getCurrentEntities().filter((entity: any) =>
        entity.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entity.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = (entity: any) => {
        // Extract client data from the entity for auto-fill
        const clientData = entity.client || {};

        onChange({
            type: entityType,
            id: entity.id,
            name: entity.name || entity.title,
            // Include client data for auto-fill
            clientName: clientData.name || entity.contactName || '',
            clientCompany: clientData.companyName || clientData.name || entity.companyName || entity.name || entity.title || '',
            clientEmail: clientData.email || entity.email || ''
        });
        setIsOpen(false);
        setSearchTerm('');
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(null);
    };

    const getEntityIcon = (type: EntityType) => {
        const config = entityTypes.find(e => e.type === type);
        const Icon = config?.icon || Building2;
        return <Icon size={16} className={config?.color.split(' ')[0]} />;
    };

    return (
        <div className="relative">
            {/* Label */}
            <label className="block text-sm font-semibold text-gray-700 mb-2">
                Link to CRM Entity
            </label>

            {/* Selected Value / Trigger */}
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`
                    w-full px-4 py-3 rounded-xl border text-left flex items-center justify-between
                    transition-all duration-200
                    ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-violet-400 cursor-pointer'}
                    ${isOpen ? 'border-violet-500 ring-2 ring-violet-100' : 'border-gray-200'}
                `}
            >
                {value ? (
                    <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg ${entityTypes.find(e => e.type === value.type)?.color}`}>
                            {getEntityIcon(value.type)}
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">{value.name}</p>
                            <p className="text-xs text-gray-500">{value.type}</p>
                        </div>
                    </div>
                ) : (
                    <span className="text-gray-400">Select Opportunity, Deal, or Project...</span>
                )}

                <div className="flex items-center gap-2">
                    {value && !disabled && (
                        <button
                            onClick={handleClear}
                            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X size={16} className="text-gray-400" />
                        </button>
                    )}
                    <ChevronDown
                        size={20}
                        className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                </div>
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Entity Type Tabs */}
                    <div className="flex border-b border-gray-100 p-2 gap-1">
                        {entityTypes.map(({ type, icon: Icon, label, color }) => (
                            <button
                                key={type}
                                onClick={() => setEntityType(type)}
                                className={`
                                    flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium
                                    transition-all duration-200
                                    ${entityType === type
                                        ? 'bg-violet-100 text-violet-700'
                                        : 'text-gray-500 hover:bg-gray-50'
                                    }
                                `}
                            >
                                <Icon size={16} />
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="p-3 border-b border-gray-100">
                        <div className="relative">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder={`Search ${entityType.toLowerCase()}s...`}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Results */}
                    <div className="max-h-64 overflow-y-auto">
                        {isLoading() ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 size={24} className="animate-spin text-violet-500" />
                            </div>
                        ) : filteredEntities.length > 0 ? (
                            filteredEntities.map((entity: any) => (
                                <button
                                    key={entity.id}
                                    onClick={() => handleSelect(entity)}
                                    className="w-full px-4 py-3 text-left hover:bg-violet-50 flex items-center gap-3 transition-colors border-b border-gray-50 last:border-0"
                                >
                                    <div className={`p-2 rounded-lg ${entityTypes.find(e => e.type === entityType)?.color}`}>
                                        {getEntityIcon(entityType)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 truncate">
                                            {entity.name || entity.title}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">
                                            {entity.company || entity.client?.name || entity.description || `ID: ${entity.id}`}
                                        </p>
                                    </div>
                                    {entity.status && (
                                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                                            {entity.status}
                                        </span>
                                    )}
                                </button>
                            ))
                        ) : (
                            <div className="py-8 text-center text-gray-500">
                                <p className="text-sm">No {entityType.toLowerCase()}s found</p>
                                {searchTerm && (
                                    <p className="text-xs mt-1">Try a different search term</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
};

export default CRMEntitySelector;
