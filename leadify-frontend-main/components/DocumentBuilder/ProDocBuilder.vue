<template>
  <div class="pro-doc-builder h-full flex flex-col bg-slate-50 overflow-hidden font-sans">
    
    <!-- Top Navigation Bar -->
    <header class="h-16 flex items-center justify-between px-6 shrink-0 z-20 m-4 rounded-[2rem]" style="background: var(--glass-bg); backdrop-filter: var(--glass-blur); border: 1px solid var(--glass-border-color); box-shadow: var(--glass-shadow);">
      <div class="flex items-center gap-4">
        <div class="flex items-center justify-center w-10 h-10 rounded-xl" style="background: rgba(124, 58, 237, 0.1); color: var(--el-color-primary);">
          <FileText size="20" />
        </div>
        <div>
          <h1 class="font-bold text-sm flex items-center gap-2" style="color: var(--text-primary);">
            {{ documentTypeTitle }} Builder
            <span class="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider" style="background: rgba(59, 130, 246, 0.1); color: #3b82f6;">Beta</span>
          </h1>
          <p class="text-xs" style="color: var(--text-muted);">Create professional {{ documentTypeTitle.toLowerCase() }}s with ease</p>
        </div>
      </div>
      
      <div class="flex items-center gap-3">
        <el-button 
          @click="showPreview = !showPreview"
          :type="showPreview ? 'primary' : 'default'"
          size="default"
          class="!rounded-xl"
        >
          <component :is="showPreview ? EyeOff : Eye" size="16" class="mr-1.5" />
          {{ showPreview ? 'Hide Preview' : 'Show Preview' }}
        </el-button>

        <el-divider direction="vertical" />

        <el-button size="default" class="!rounded-xl" @click="exportPdf">
          <Download size="16" class="mr-1.5" /> Export PDF
        </el-button>
        <el-button size="default" class="!rounded-xl" @click="archiveCurrentDoc">
          <FileText size="16" class="mr-1.5" /> Archive
        </el-button>
        <el-dropdown v-if="availableConversions.length > 0" trigger="click" @command="handleConvert">
          <el-button size="default" class="!rounded-xl">
            Convert to... <el-icon class="ml-1"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-for="conv in availableConversions" :key="conv.type" :command="conv.type">
                {{ conv.label }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button type="primary" size="default" class="!rounded-xl" style="background: var(--bg-obsidian); border: none;" @click="handleSave" :loading="saving">
          <Save size="16" class="mr-1.5" /> Save {{ documentTypeTitle }}
        </el-button>
      </div>
    </header>

    <!-- Main Workspace -->
    <main class="flex-1 flex overflow-hidden">
      <!-- Left Sidebar (Steps Navigation) -->
      <aside class="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0 z-10 p-4">
        <nav class="space-y-1 mt-4">
          <button 
            v-for="step in defaultSteps" 
            :key="step.id"
            @click="activeStep = step.id"
            class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
            :class="activeStep === step.id ? 'bg-violet-50 text-violet-700 font-bold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium'"
          >
            <component :is="step.icon" size="18" :class="activeStep === step.id ? 'text-violet-600' : 'text-gray-400'" />
            <span class="text-sm">{{ formData.stepLabels?.[step.id] || step.label }}</span>
          </button>

          <!-- Custom Sections -->
          <div v-if="formData.customSections?.length" class="my-4 pt-4 border-t border-gray-100">
            <p class="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center justify-between">
               Custom Sections
               <span class="text-[8px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-400">Drag to reorder</span>
            </p>
            <draggable 
              v-model="formData.customSections" 
              animation="200"
              item-key="id"
              ghost-class="opacity-50"
              @change="onCustomSectionReorder"
            >
               <template #item="{ element: section }">
                 <button 
                   @click="activeStep = section.id"
                   class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all cursor-grab active:cursor-grabbing group"
                   :class="activeStep === section.id ? 'bg-violet-50 text-violet-700 font-bold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium'"
                 >
                   <GripVertical size="14" class="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                   <Layers size="16" :class="activeStep === section.id ? 'text-violet-600' : 'text-gray-400'" />
                   <span class="text-sm truncate flex-1">{{ section.title }}</span>
                 </button>
               </template>
            </draggable>
          </div>
        </nav>

        <button 
          @click="addCustomSection"
          class="mt-auto flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-gray-200 text-gray-500 rounded-xl hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50 transition-all text-sm font-bold"
        >
          <Plus size="16" /> Add Section
        </button>
      </aside>

      <!-- Center (Form Editor) -->
      <section class="flex-1 overflow-y-auto custom-scrollbar relative p-8 lg:p-12">
        <div class="max-w-4xl mx-auto pb-24">
          
          <!-- Content injected here via step logic -->
          <div v-if="activeStep === 'branding'" class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             
             <!-- Basic Details -->
             <div class="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                <h3 class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2"><FileText size="20" class="text-violet-500" /> Document Details</h3>
                <div class="grid grid-cols-2 gap-6">
                   <div>
                      <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">{{ documentTypeTitle }} Title</label>
                      <input v-model="formData.title" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition-all text-sm font-bold text-gray-800" placeholder="e.g. Enterprise CRM Implementation" />
                   </div>
                   <div>
                      <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Reference Number</label>
                      <input v-model="formData.refNumber" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition-all text-sm font-bold text-gray-800" />
                   </div>
                   <div v-if="!isFullDoc">
                      <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Due Date</label>
                      <input type="date" v-model="formData.dueDate" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition-all text-sm font-bold text-gray-800" />
                   </div>
                </div>
             </div>

             <!-- Client Details -->
             <div class="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                <div class="flex items-center justify-between mb-6">
                   <h3 class="text-xl font-bold text-gray-900 flex items-center gap-2"><User size="20" class="text-violet-500" /> Client Information</h3>
                   <el-select 
                     v-model="selectedClientId" 
                     placeholder="Select existing client..." 
                     size="large"
                     class="w-64 !rounded-xl"
                     @change="handleClientSelect"
                     clearable
                   >
                      <el-option v-for="client in mockClients" :key="client.id" :label="client.company" :value="client.id" />
                   </el-select>
                </div>
                
                <div class="grid grid-cols-2 gap-6 mb-6">
                   <div>
                      <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Client Company</label>
                      <input v-model="formData.clientName" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition-all text-sm font-bold text-gray-800" placeholder="e.g. Acme Corp" />
                   </div>
                   <div>
                      <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Contact Name</label>
                      <input v-model="formData.clientCompany" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition-all text-sm font-bold text-gray-800" placeholder="e.g. John Doe" />
                   </div>
                </div>
                <!-- Extended Client Fields (Non-Proposal) -->
                <div v-if="!isFullDoc" class="grid grid-cols-2 gap-6">
                   <div>
                      <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Client Email</label>
                      <input v-model="formData.clientEmail" type="email" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition-all text-sm font-bold text-gray-800" placeholder="client@company.com" />
                   </div>
                   <div>
                      <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Client Phone</label>
                      <input v-model="formData.clientPhone" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition-all text-sm font-bold text-gray-800" placeholder="+966 5XX XXX XXXX" />
                   </div>
                   <div>
                      <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Client Address</label>
                      <input v-model="formData.clientAddress" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition-all text-sm font-bold text-gray-800" placeholder="Street, City, Country" />
                   </div>
                   <div>
                      <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Client Tax ID / VAT</label>
                      <input v-model="formData.clientTaxId" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition-all text-sm font-bold text-gray-800" placeholder="3XXXXXXXXXXX03" />
                   </div>
                </div>
             </div>

             <!-- Company Info (Non-Proposal Only) -->
             <div v-if="!isFullDoc" class="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                <h3 class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2"><FileText size="20" class="text-emerald-500" /> Your Company Details</h3>
                <div class="grid grid-cols-2 gap-6">
                   <div>
                      <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Company Name</label>
                      <input v-model="formData.companyName" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition-all text-sm font-bold text-gray-800" placeholder="Your Company Name" />
                   </div>
                   <div>
                      <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Company Email</label>
                      <input v-model="formData.companyEmail" type="email" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition-all text-sm font-bold text-gray-800" placeholder="info@company.com" />
                   </div>
                   <div>
                      <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Company Address</label>
                      <input v-model="formData.companyAddress" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition-all text-sm font-bold text-gray-800" placeholder="Riyadh, Saudi Arabia" />
                   </div>
                   <div>
                      <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Company Phone</label>
                      <input v-model="formData.companyPhone" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition-all text-sm font-bold text-gray-800" placeholder="+966 XX XXX XXXX" />
                   </div>
                   <div>
                      <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Tax ID / VAT Number</label>
                      <input v-model="formData.companyTaxId" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition-all text-sm font-bold text-gray-800" placeholder="3XXXXXXXXXXX03" />
                   </div>
                </div>
             </div>

             <!-- Bank Details (Invoices / Proforma / Credit Notes Only) -->
             <div v-if="['invoice', 'proforma_invoice', 'credit_note'].includes(props.documentType)" class="bg-white p-8 rounded-[2rem] shadow-sm border border-blue-100">
                <h3 class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2"><DollarSign size="20" class="text-blue-500" /> Bank & Payment Details</h3>
                <div class="grid grid-cols-2 gap-6">
                   <div>
                      <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Bank Name</label>
                      <input v-model="formData.bankName" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition-all text-sm font-bold text-gray-800" placeholder="e.g. Al Rajhi Bank" />
                   </div>
                   <div>
                      <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Account Name</label>
                      <input v-model="formData.bankAccountName" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition-all text-sm font-bold text-gray-800" placeholder="Company Account Name" />
                   </div>
                   <div>
                      <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">IBAN</label>
                      <input v-model="formData.bankIban" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition-all text-sm font-bold text-gray-800 font-mono" placeholder="SA00 0000 0000 0000 0000 0000" />
                   </div>
                   <div>
                      <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">SWIFT Code</label>
                      <input v-model="formData.bankSwift" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition-all text-sm font-bold text-gray-800 font-mono" placeholder="RJHISARI" />
                   </div>
                </div>
             </div>

             <!-- Branding Options -->
             <div class="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                <h3 class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2"><Palette size="20" class="text-violet-500" /> Design & Theme</h3>
                
                <div class="mb-8">
                   <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Theme Color</label>
                   <div class="flex flex-wrap gap-3">
                      <button 
                        v-for="(color, name) in themeColors" :key="name"
                        @click="formData.themeColor = color"
                        class="w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110 shadow-sm border-2"
                        :class="formData.themeColor === color ? 'border-gray-900 scale-110' : 'border-transparent'"
                        :style="{ backgroundColor: color }"
                        :title="name"
                      >
                         <CheckCircle v-if="formData.themeColor === color" size="16" class="text-white drop-shadow-md" />
                      </button>
                      <div class="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full border border-gray-200">
                        <input type="color" v-model="formData.themeColor" class="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0" />
                        <span class="text-xs font-mono text-gray-500">{{ formData.themeColor }}</span>
                      </div>
                   </div>
                </div>

                <div v-if="isFullDoc">
                   <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Cover Page Style</label>
                   <p class="text-xs text-gray-400 mb-4">Choose from 32 premium cover page designs.</p>
                   <div class="grid grid-cols-2 lg:grid-cols-3 gap-4">
                      <button 
                        v-for="style in coverStylesList" :key="style.id"
                        @click="formData.coverStyle = style.id as any"
                        class="relative aspect-[1/1.414] rounded-xl overflow-hidden border-2 transition-all hover:shadow-lg group text-left"
                        :class="formData.coverStyle === style.id ? 'border-violet-500 ring-4 ring-violet-500/20' : 'border-gray-200 hover:border-violet-300'"
                      >
                         <div class="absolute inset-0 bg-gray-50 flex flex-col justify-end p-3">
                            <span class="text-xs font-bold text-gray-900 group-hover:text-violet-600 transition-colors">{{ style.label }}</span>
                            <span class="text-[9px] text-gray-500">{{ style.category }}</span>
                         </div>
                         <div v-if="formData.coverStyle === style.id" class="absolute top-2 right-2 bg-violet-500 text-white rounded-full p-1 shadow-md">
                            <CheckCircle size="12" />
                         </div>
                      </button>
                   </div>
                </div>
                <div v-else class="bg-violet-50 border border-violet-100 rounded-xl p-4">
                   <p class="text-sm text-violet-700 flex items-center gap-2"><CheckCircle size="16" class="text-violet-500" /> This document type uses a pre-designed professional template. The theme color above will be applied automatically.</p>
                </div>
             </div>
          </div>

          <div v-else-if="activeStep === 'executive'" class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div class="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                <h3 class="text-xl font-bold text-gray-900 mb-6">Introduction</h3>
                <RichTextEditor v-model="formData.introduction" placeholder="Write a compelling introduction..." minHeight="300px" />
             </div>
             <div class="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                <h3 class="text-xl font-bold text-gray-900 mb-6">Objectives</h3>
                <RichTextEditor v-model="formData.objectives" placeholder="What are the key goals and objectives?" minHeight="200px" />
             </div>
          </div>
          
           <div v-else-if="activeStep === 'solution'" class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div class="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                <h3 class="text-xl font-bold text-gray-900 mb-6">Scope of Work</h3>
                <RichTextEditor v-model="formData.scopeOfWork" placeholder="Detail the scope of work..." minHeight="300px" />
              </div>
              <div class="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                <h3 class="text-xl font-bold text-gray-900 mb-6">Methodology</h3>
                <RichTextEditor v-model="formData.methodology" placeholder="Explain your methodology..." minHeight="200px" />
              </div>
          </div>
          
           <div v-else-if="activeStep === 'financial'" class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div class="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 mb-8">
                 <div class="flex items-center justify-between mb-8">
                    <h3 class="text-xl font-bold text-gray-900 flex items-center gap-2">
                       <DollarSign size="20" class="text-violet-500" /> Pricing & Investment
                    </h3>
                    <div class="flex items-center gap-4 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">
                       <span class="text-xs font-bold text-gray-500 uppercase tracking-widest">Global Margin</span>
                       <div class="flex items-center gap-2">
                          <input type="range" v-model.number="globalMargin" min="0" max="100" class="w-24 accent-violet-600" @input="applyGlobalMargin" />
                          <span class="text-sm font-bold text-violet-600 w-8">{{ globalMargin }}%</span>
                       </div>
                    </div>
                 </div>

                 <!-- Items Table -->
                 <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                       <thead>
                          <tr class="border-b-2 border-gray-100">
                             <th class="pb-4 text-xs font-bold text-gray-400 uppercase tracking-widest w-[40%]">Description</th>
                             <th class="pb-4 text-xs font-bold text-gray-400 uppercase tracking-widest w-[15%]">Qty & Unit</th>
                             <th class="pb-4 text-xs font-bold text-gray-400 uppercase tracking-widest w-[15%]">Cost ({{ formData.currency }})</th>
                             <th class="pb-4 text-xs font-bold text-gray-400 uppercase tracking-widest w-[10%]">Margin</th>
                             <th class="pb-4 text-right text-xs font-bold text-gray-400 uppercase tracking-widest w-[15%]">Rate ({{ formData.currency }})</th>
                             <th class="pb-4 text-right text-xs font-bold text-gray-400 uppercase tracking-widest w-[5%]"></th>
                          </tr>
                       </thead>
                       <tbody class="divide-y divide-gray-50">
                          <tr v-for="(item, index) in formData.items" :key="item.id" class="group">
                             <td class="py-4 pr-4">
                                <input v-model="item.description" class="w-full px-3 py-2 bg-transparent border border-transparent rounded-lg focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-100 outline-none transition-all text-sm font-bold text-gray-800" placeholder="Item description" />
                             </td>
                             <td class="py-4 pr-4">
                                <div class="flex gap-2">
                                   <input type="number" v-model.number="item.quantity" class="w-16 px-2 py-2 text-center bg-gray-50 border border-gray-200 rounded-lg focus:border-violet-500 outline-none transition-all text-sm font-bold text-gray-800" min="1" />
                                   <input v-model="item.unit" class="w-full px-2 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:border-violet-500 outline-none transition-all text-sm text-gray-600" placeholder="Unit" />
                                </div>
                             </td>
                             <td class="py-4 pr-4">
                                <input type="number" v-model.number="item.cost" @input="recalculateItemRate(index)" class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:border-violet-500 outline-none transition-all text-sm font-bold text-gray-800" min="0" />
                             </td>
                             <td class="py-4 pr-4 relative">
                                <input type="number" v-model.number="item.margin" @input="recalculateItemRate(index)" class="w-full pl-3 pr-6 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:border-violet-500 outline-none transition-all text-sm font-bold text-violet-600" min="0" max="100" />
                                <span class="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">%</span>
                             </td>
                             <td class="py-4 text-right">
                                <input type="number" v-model.number="item.rate" @input="recalculateItemMargin(index)" class="w-full text-right px-3 py-2 bg-transparent border border-transparent rounded-lg focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-100 outline-none transition-all text-sm font-bold text-gray-900" min="0" />
                             </td>
                             <td class="py-4 text-right pl-2">
                                <button @click="removeItem(index)" class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                                   <Trash2 size="16" />
                                </button>
                             </td>
                          </tr>
                       </tbody>
                    </table>
                 </div>

                 <button @click="addItem" class="mt-4 flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-gray-200 text-gray-500 rounded-xl hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50 transition-all text-sm font-bold">
                    <Plus size="16" /> Add Item
                 </button>
              </div>

              <!-- Summary Totals -->
              <div class="flex gap-8 items-start">
                 <!-- Config -->
                 <div class="flex-1 bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                    <h4 class="text-sm font-bold text-gray-900 mb-6">Tax & Discount Configuration</h4>
                    <div class="grid grid-cols-2 gap-6">
                       <div>
                          <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Discount</label>
                          <div class="flex gap-2">
                             <input type="number" v-model.number="formData.discount" class="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none" min="0" />
                             <select v-model="formData.discountType" class="w-24 px-2 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm font-bold">
                                <option value="percent">%</option>
                                <option value="fixed">{{ formData.currency }}</option>
                             </select>
                          </div>
                       </div>
                       <div>
                          <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Tax Rate (%)</label>
                          <input type="number" v-model.number="formData.taxRate" class="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none" min="0" max="100" />
                       </div>
                       <div>
                           <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Currency</label>
                           <select v-model="formData.currency" class="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm font-bold">
                              <option value="SAR">SAR - Saudi Riyal</option>
                              <option value="USD">USD - US Dollar</option>
                              <option value="EUR">EUR - Euro</option>
                              <option value="GBP">GBP - British Pound</option>
                              <option value="AED">AED - UAE Dirham</option>
                              <option value="EGP">EGP - Egyptian Pound</option>
                              <option value="KWD">KWD - Kuwaiti Dinar</option>
                              <option value="QAR">QAR - Qatari Riyal</option>
                              <option value="BHD">BHD - Bahraini Dinar</option>
                              <option value="OMR">OMR - Omani Rial</option>
                           </select>
                        </div>
                        <div>
                           <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Document Status</label>
                           <select v-model="formData.status" class="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm font-bold">
                              <option value="Draft">Draft</option>
                              <option value="Sent">Sent</option>
                              <option value="Approved">Approved / Paid</option>
                              <option value="Rejected">Rejected / Cancelled</option>
                              <option value="Archived">Archived</option>
                           </select>
                        </div>
                    </div>
                 </div>

                 <!-- Live Totals -->
                 <div class="w-80 bg-gray-900 p-8 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
                    <div class="absolute top-0 right-0 w-32 h-32 bg-violet-500/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
                    <h4 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 relative z-10">Investment Summary</h4>
                    <div class="space-y-4 relative z-10 text-sm">
                       <div class="flex justify-between items-center text-gray-300">
                          <span>Subtotal</span>
                          <span class="font-mono">{{ subtotal.toLocaleString() }}</span>
                       </div>
                       <div v-if="formData.discount > 0" class="flex justify-between items-center text-green-400">
                          <span>Discount</span>
                          <span class="font-mono">-{{ discountAmount.toLocaleString() }}</span>
                       </div>
                       <div class="flex justify-between items-center text-gray-300 border-b border-gray-700 pb-4">
                          <span>Tax ({{ formData.taxRate }}%)</span>
                          <span class="font-mono">{{ taxAmount.toLocaleString() }}</span>
                       </div>
                       <div class="flex justify-between items-end pt-2">
                          <span class="text-gray-400 font-bold">Total</span>
                          <div class="text-right">
                             <span class="text-xs text-gray-500 mr-2">{{ formData.currency }}</span>
                             <span class="text-3xl font-bold tracking-tight text-white">{{ finalTotal.toLocaleString() }}</span>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
          </div>
          
           <div v-else-if="activeStep === 'legal'" class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div class="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                <h3 class="text-xl font-bold text-gray-900 mb-6">Terms & Conditions</h3>
                <RichTextEditor v-model="formData.termsAndConditions" placeholder="Enter legal terms..." minHeight="300px" />
              </div>
               <div class="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                 <h3 class="text-xl font-bold text-gray-900 mb-6">Payment Terms</h3>
                 <RichTextEditor v-model="formData.paymentTerms" placeholder="Payment schedule..." minHeight="200px" />
               </div>
               <!-- Notes -->
               <div class="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                 <h3 class="text-xl font-bold text-gray-900 mb-6">Notes</h3>
                 <textarea 
                   v-model="formData.notes" 
                   class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition-all text-sm text-gray-800 resize-y" 
                   rows="4" 
                   placeholder="Any additional notes to include on the document..."
                 ></textarea>
               </div>
           </div>

           <!-- Custom Sections Loop -->
           <template v-for="(section, index) in formData.customSections" :key="section.id">
             <div v-show="activeStep === section.id" class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div class="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 relative">
                   <!-- Section Settings -->
                   <div class="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
                     <div class="flex-1 max-w-md">
                       <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Section Title</label>
                       <input 
                         v-model="section.title" 
                         class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition-all text-sm font-bold text-gray-900" 
                         placeholder="e.g. Server Architecture" 
                       />
                     </div>
                     <button 
                       @click="removeCustomSection(index, section.id)" 
                       class="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl text-sm font-bold transition-colors mt-6"
                     >
                       <Trash2 size="16" /> Delete Section
                     </button>
                   </div>

                   <!-- Editor -->
                   <RichTextEditor v-model="section.content" :placeholder="`Write content for ${section.title || 'this section'}...`" minHeight="400px" />
                </div>
            </div>
           </template>

        </div>
      </section>

      <!-- Right (Live Preview) -->
      <section 
        v-show="showPreview" 
        class="w-[45%] bg-slate-200 overflow-y-auto custom-scrollbar border-l border-gray-300 relative flex flex-col items-center py-12"
        style="background-image: radial-gradient(#cbd5e1 1.5px, transparent 1.5px); background-size: 24px 24px;"
        data-print-area
      >
        <!-- Scaling Wrapper -->
        <div class="sticky top-4 z-50 flex items-center gap-2 bg-black/80 backdrop-blur text-white px-4 py-2 rounded-full mb-8 shadow-xl">
             <button @click="zoom -= 0.1" class="p-1 hover:text-violet-300"><ZoomOut size="16" /></button>
             <span class="text-xs font-mono font-bold w-12 text-center">{{ Math.round(zoom * 100) }}%</span>
             <button @click="zoom += 0.1" class="p-1 hover:text-violet-300"><ZoomIn size="16" /></button>
        </div>

        <div :style="{ transform: `scale(${zoom})`, transformOrigin: 'top center' }" class="transition-transform duration-200 pb-[100px]">
          <!-- Proposals & Contracts: Full rich template with covers -->
          <ProposalPrintTemplate 
            v-if="isFullDoc"
            :data="formData" 
          />
          <!-- All other docs: Fixed professional template -->
          <FixedDocumentTemplate
            v-else
            :data="formData"
          />
        </div>
      </section>
    </main>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from 'vue';
import draggable from 'vuedraggable';
// Lightweight icon shims using Nuxt Icon (replaces lucide-vue-next)
import { h, type FunctionalComponent } from 'vue';

const iconShim = (name: string): FunctionalComponent<{ size?: number | string; class?: string }> =>
  (props, { attrs }) => h(resolveComponent('Icon'), { name, size: props.size || 20, class: props.class, ...attrs });

const FileText = iconShim('ph:file-text');
const Eye = iconShim('ph:eye');
const EyeOff = iconShim('ph:eye-slash');
const Save = iconShim('ph:floppy-disk');
const Download = iconShim('ph:download-simple');
const Plus = iconShim('ph:plus');
const Palette = iconShim('ph:palette');
const User = iconShim('ph:user');
const Layers = iconShim('ph:stack');
const DollarSign = iconShim('ph:currency-dollar');
const CheckSquare = iconShim('ph:check-square');
const ZoomOut = iconShim('ph:minus-circle');
const ZoomIn = iconShim('ph:plus-circle');
const CheckCircle = iconShim('ph:check-circle');
const Trash2 = iconShim('ph:trash');
const GripVertical = iconShim('ph:dots-six-vertical');

// Components
import ProposalPrintTemplate from './ProposalPrintTemplate.vue';
import FixedDocumentTemplate from './FixedDocumentTemplate.vue';
import RichTextEditor from './RichTextEditor.vue';

// Types
import type { ProposalData, CustomSection } from './types';
import { useDocumentArchive } from '~/composables/useDocumentArchive';
import { getAvailableConversions, convertDocument } from '~/composables/useDocumentConversion';
import { useDocBuilder } from '~/composables/useDocBuilder';
import { ArrowDown } from '@element-plus/icons-vue';

const props = withDefaults(defineProps<{
  documentType?: 'proposal' | 'invoice' | 'proforma_invoice' | 'purchase_order' | 'credit_note' | 'contract' | 'rfq' | 'sales_order' | 'quote' | 'delivery_note' | 'sla';
  proposalId?: string;
  documentId?: string;
  initialData?: any;
}>(), {
  documentType: 'proposal'
});

const emit = defineEmits(['save', 'saved']);

// Save State
const saving = ref(false);

const { createDocument, updateDocument } = useDocBuilder();

async function handleSave() {
  if (props.documentType === 'proposal') {
    // Proposals use the dedicated proposal API for backward compatibility
    saving.value = true;
    try {
      const payload: any = {
        title: formData.title,
        reference: formData.refNumber,
        proposalFor: formData.clientCompany || formData.clientName,
        type: formData.type || 'MIXED',
        content: JSON.stringify(formData),
        notes: formData.notes || undefined,
      };

      if (props.proposalId) {
        const response = await useApiFetch(`proposal/${props.proposalId}`, 'PUT', payload);
        if (response?.success) {
          ElMessage.success('Proposal updated successfully');
          emit('saved', { id: props.proposalId, ...payload });
        } else {
          ElMessage.error(response?.message || 'Failed to update proposal');
        }
      } else {
        const response = await useApiFetch('proposal', 'POST', payload);
        if (response?.success) {
          ElMessage.success('Proposal created successfully');
          emit('saved', response.body);
          navigateTo(`/sales/proposals/${response.body?.id}`);
        } else {
          ElMessage.error(response?.message || 'Failed to create proposal');
        }
      }
    } catch (error: any) {
      ElMessage.error(error?.message || 'An error occurred while saving');
    } finally {
      saving.value = false;
    }
  } else {
    // All other document types use the universal doc-builder API
    saving.value = true;
    try {
      const payload: any = {
        type: props.documentType,
        title: formData.title,
        reference: formData.refNumber,
        content: JSON.stringify(formData),
        clientName: formData.clientName || undefined,
        clientCompany: formData.clientCompany || undefined,
        clientEmail: formData.clientEmail || undefined,
        subtotal: subtotal.value || undefined,
        discount: discountAmount.value || undefined,
        tax: taxAmount.value || undefined,
        total: finalTotal.value || undefined,
        currency: formData.currency || 'SAR',
        notes: formData.notes || undefined,
        validUntil: formData.validUntil || undefined,
      };

      if (props.documentId) {
        const response = await updateDocument(props.documentId, { ...payload, changeNote: 'Updated via builder' });
        if (response?.success) {
          ElMessage.success(`${documentTypeTitle.value} updated successfully`);
          emit('saved', response.body);
        } else {
          ElMessage.error(response?.message || `Failed to update ${documentTypeTitle.value.toLowerCase()}`);
        }
      } else {
        const response = await createDocument(payload);
        if (response?.success) {
          ElMessage.success(`${documentTypeTitle.value} created successfully`);
          emit('saved', response.body);
          // Navigate to the document detail page
          const typeSlug = props.documentType.replace(/_/g, '-') + 's';
          navigateTo(`/sales/${typeSlug}/${response.body?.id}`);
        } else {
          ElMessage.error(response?.message || `Failed to create ${documentTypeTitle.value.toLowerCase()}`);
        }
      }
    } catch (error: any) {
      ElMessage.error(error?.message || 'An error occurred while saving');
    } finally {
      saving.value = false;
    }
  }
}

// Layout State
const showPreview = ref(true);
const activeStep = ref('branding');
const zoom = ref(0.65);

const documentTypeTitle = computed(() => {
  if (!props.documentType) return 'Proposal';
  const type = props.documentType.replace('_', ' ');
  return type.charAt(0).toUpperCase() + type.slice(1);
});

// Client Selection Logic
const selectedClientId = ref<string | null>(null);

// Mock data (Would normally be fetched from the API/Store)
const mockClients = [
  { id: 'cli_1', company: 'Acme Corp', name: 'John Doe', email: 'john@acmecorp.com' },
  { id: 'cli_2', company: 'TechNova', name: 'Sarah Smith', email: 'sarah@technova.io' },
  { id: 'cli_3', company: 'Global Industries', name: 'Michael Chang', email: 'm.chang@globalind.com' }
];

const handleClientSelect = (clientId: string) => {
  if (!clientId) {
    formData.clientCompany = '';
    formData.clientName = '';
    formData.clientEmail = ''; // Assuming email exists in your type
    return;
  }
  const client = mockClients.find(c => c.id === clientId);
  if (client) {
    formData.clientCompany = client.company;
    formData.clientName = client.name;
    formData.clientEmail = client.email;
  }
};

const defaultSteps = computed(() => {
  const isFullDoc = ['proposal', 'contract'].includes(props.documentType || 'proposal');
  
  const steps = [
    { id: 'branding', label: isFullDoc ? 'Branding & Details' : 'Document Details', icon: Palette },
    { id: 'executive', label: props.documentType === 'contract' ? 'Contract Summary' : 'Executive Summary', icon: User },
    { id: 'solution', label: props.documentType === 'contract' ? 'Obligations & Scope' : 'Solution & Scope', icon: Layers },
    { id: 'financial', label: isFullDoc ? 'Investment' : 'Items & Pricing', icon: DollarSign },
    { id: 'legal', label: 'Terms & Legal', icon: CheckSquare },
  ];
  
  // Clean up steps based on document type
  if (!isFullDoc) {
    return steps.filter(step => step.id !== 'executive' && step.id !== 'solution');
  }
  return steps;
});

const themeColors: Record<string, string> = {
  'Violet': '#7c3aed',
  'Blue': '#2563eb',
  'Emerald': '#10b981',
  'Rose': '#e11d48',
  'Amber': '#f59e0b',
  'Slate': '#475569',
  'Sky': '#0284c7',
  'Indigo': '#4f46e5'
};

const coverStylesList = [
  { id: 'corporate', label: 'Corporate Minimal', category: 'Professional' },
  { id: 'business', label: 'Business Classic', category: 'Professional' },
  { id: 'enterprise', label: 'Enterprise Dark', category: 'Professional' },
  { id: 'swiss', label: 'Swiss Typography', category: 'Minimalist' },
  { id: 'minimal', label: 'Clean Minimal', category: 'Minimalist' },
  { id: 'japaneseminimal', label: 'Japanese Minimal', category: 'Minimalist' },
  { id: 'blueprintdark', label: 'Blueprint Dark', category: 'Technical' },
  { id: 'tech', label: 'Tech Grid', category: 'Technical' },
  { id: 'terminal', label: 'Terminal Connect', category: 'Technical' },
  { id: 'creative', label: 'Creative Bold', category: 'Creative' },
  { id: 'modernart', label: 'Modern Art', category: 'Creative' },
  { id: 'artdeco', label: 'Art Deco', category: 'Creative' },
  { id: 'geometric', label: 'Geometric Splice', category: 'Modern' },
  { id: 'gradientsplash', label: 'Gradient Splash', category: 'Modern' },
  { id: 'neonnight', label: 'Neon Night', category: 'Modern' },
  { id: 'darkmode', label: 'Dark Mode Focus', category: 'Dark' },
  { id: 'midnightgradient', label: 'Midnight Gradient', category: 'Dark' },
  { id: 'architectural', label: 'Architectural', category: 'Specific' },
  { id: 'brutalist', label: 'Brutalist Raw', category: 'Specific' },
  { id: 'nature', label: 'Organic Nature', category: 'Specific' },
  { id: 'abstract', label: 'Abstract Fluid', category: 'Artistic' },
  { id: 'retropop', label: 'Retro Pop', category: 'Artistic' },
  { id: 'brushstroke', label: 'Brush Stroke', category: 'Artistic' },
  { id: 'mondrian', label: 'Mondrian Code', category: 'Artistic' },
  { id: 'magazineeditorial', label: 'Magazine Editorial', category: 'Editorial' },
  { id: 'newspaper', label: 'Daily Newspaper', category: 'Editorial' },
  { id: 'futuristicgrid', label: 'Futuristic Grid', category: 'Experimental' },
  { id: 'ethereal', label: 'Ethereal Cloud', category: 'Experimental' },
  { id: 'aurora', label: 'Aurora Borealis', category: 'Experimental' },
  { id: 'warmboho', label: 'Warm Boho', category: 'Lifestyle' },
  { id: 'glassmorphism', label: 'Glassmorphism', category: 'UI Trend' },
  { id: 'boldtypography', label: 'Bold Typography', category: 'Typography' }
];

const isFullDoc = ['proposal', 'contract'].includes(props.documentType || 'proposal');

// Smart document numbering prefix
const docRefPrefixes: Record<string, string> = {
  proposal: 'PRP', contract: 'CTR', invoice: 'INV', proforma_invoice: 'PI', purchase_order: 'PO',
  credit_note: 'CN', quote: 'QT', rfq: 'RFQ', sales_order: 'SO', delivery_note: 'DN', sla: 'SLA'
};
const docDefaultTitles: Record<string, string> = {
  proposal: 'Project Proposal', contract: 'Service Agreement', invoice: 'Invoice',
  proforma_invoice: 'Proforma Invoice', purchase_order: 'Purchase Order', credit_note: 'Credit Note',
  quote: 'Quotation', rfq: 'Request for Quotation', sales_order: 'Sales Order', delivery_note: 'Delivery Note',
  sla: 'Service Level Agreement'
};
const refPrefix = docRefPrefixes[props.documentType] || 'DOC';
const defaultTitle = docDefaultTitles[props.documentType] || 'Document';

// Mock Form Data (Initial State identical to React version)
const formData = reactive<ProposalData>({
  id: Date.now(),
  refNumber: `${refPrefix}-${new Date().getFullYear()}-${String(Math.floor(1 + Math.random() * 9999)).padStart(4, '0')}`,
  title: defaultTitle,
  clientName: '',
  clientCompany: '',
  clientEmail: '',
  date: new Date().toISOString().split('T')[0] || '',
  validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] || '',
  status: 'Draft',
  type: 'MIXED',
  documentType: props.documentType || 'proposal',
  themeColor: '#7c3aed', // Default violet
  coverStyle: 'corporate',
  font: 'sans',
  logo: '',
  clientLogo: '',
  stepOrder: isFullDoc ? ['executive', 'solution', 'financial', 'legal'] : ['financial', 'legal'],
  stepLabels: {
    branding: isFullDoc ? 'Branding & Details' : 'Document Details',
    executive: props.documentType === 'contract' ? 'Contract Summary' : 'Executive Summary',
    solution: props.documentType === 'contract' ? 'Obligations & Scope' : 'Solution & Scope',
    financial: isFullDoc ? 'Investment' : 'Items & Pricing',
    legal: 'Terms & Legal'
  },
  introduction: '',
  objectives: '',
  scopeOfWork: '',
  methodology: '',
  phases: [],
  customSections: [],
  currency: 'SAR',
  items: [
     { id: 1, description: 'Discovery & Planning', quantity: 1, unit: 'Lump Sum', cost: 0, margin: 20, rate: 5000 }
  ],
  taxRate: 15,
  discount: 0,
  discountType: 'percent',
  paymentTerms: '',
  termsAndConditions: '',
  companyName: '',
  companyAddress: '',
  companyPhone: '',
  companyEmail: '',
  companyTaxId: '',
  clientAddress: '',
  clientPhone: '',
  clientTaxId: '',
  bankName: '',
  bankAccountName: '',
  bankIban: '',
  bankSwift: '',
  notes: '',
  dueDate: '',
  version: 1,
  lastModified: new Date().toISOString()
});

// Load initial data if provided (edit mode)
if (props.initialData && typeof props.initialData === 'object') {
  Object.assign(formData, props.initialData);
}

const globalMargin = ref(20);

const applyGlobalMargin = () => {
  formData.items.forEach(item => {
    item.margin = globalMargin.value;
    item.rate = item.cost / (1 - (globalMargin.value / 100));
  });
};

// ── Export PDF ──────────────────────────────────────────
const exportPdf = async () => {
  const wasHidden = !showPreview.value;
  showPreview.value = true;

  await nextTick();

  const printArea = document.querySelector('[data-print-area]');
  if (!printArea) {
    ElMessage.error('Preview area not found');
    return;
  }

  // Temporarily remove zoom transform for accurate capture
  const scaleWrapper = printArea.querySelector('[style*="transform"]') as HTMLElement;
  const origTransform = scaleWrapper?.style.transform;
  if (scaleWrapper) scaleWrapper.style.transform = 'none';

  try {
    const html2pdfModule = await import('html2pdf.js');
    const html2pdf = html2pdfModule.default || html2pdfModule;

    await html2pdf().set({
      margin: 0,
      filename: `${formData.refNumber || 'document'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'], before: '.proposal-print-page' }
    } as any).from(scaleWrapper || printArea).save();

    ElMessage.success('PDF exported successfully');
  } catch (err) {
    console.error('PDF export failed:', err);
    ElMessage.error('PDF export failed — falling back to print');
    window.print();
  } finally {
    if (scaleWrapper && origTransform) scaleWrapper.style.transform = origTransform;
    if (wasHidden) showPreview.value = false;
  }
};

// ── Archive ────────────────────────────────────────────
const { archiveDocument } = useDocumentArchive();

const archiveCurrentDoc = async () => {
  const success = await archiveDocument({
    id: formData.id,
    refNumber: formData.refNumber,
    title: formData.title,
    documentType: formData.documentType,
    clientName: formData.clientName || formData.clientCompany || 'Unknown',
    clientCompany: formData.clientCompany,
    total: finalTotal.value,
    currency: formData.currency,
    status: formData.status,
    createdAt: formData.date,
  });
  if (success) {
    ElMessage.success(`${formData.refNumber} archived successfully.`);
  } else {
    ElMessage.warning('This document is already archived.');
  }
};

// ── Document Conversion ────────────────────────────────
const availableConversions = computed(() => getAvailableConversions(props.documentType));

const handleConvert = (targetType: string) => {
  ElMessageBox.confirm(
    `Convert this ${documentTypeTitle.value} to ${targetType.replace('_', ' ')}? A new document will be created with the same data.`,
    'Convert Document',
    { confirmButtonText: 'Convert', cancelButtonText: 'Cancel', type: 'info' }
  ).then(() => {
    const converted = convertDocument(formData, targetType);
    // Apply converted data
    Object.assign(formData, converted);
    ElMessage.success(`Converted to ${targetType.replace('_', ' ')} — Ref: ${converted.refNumber}`);
  }).catch(() => {});
};

const recalculateItemRate = (index: number) => {
  const item = formData.items[index];
  if (!item) return;
  if (item.cost >= 0 && item.margin >= 0 && item.margin < 100) {
    item.rate = item.cost / (1 - (item.margin / 100));
  }
};

const recalculateItemMargin = (index: number) => {
  const item = formData.items[index];
  if (!item) return;
  if (item.rate > 0 && item.cost >= 0) {
    item.margin = ((item.rate - item.cost) / item.rate) * 100;
  }
};

const addItem = () => {
  formData.items.push({
    id: Date.now(),
    description: '',
    quantity: 1,
    unit: 'Unit',
    cost: 0,
    margin: globalMargin.value,
    rate: 0
  });
};

const removeItem = (index: number) => {
  formData.items.splice(index, 1);
};

// Computed Financials

const subtotal = computed(() => {
  return formData.items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.rate || 0)), 0);
});

const discountAmount = computed(() => {
  if (formData.discountType === 'percent') {
    return subtotal.value * ((formData.discount || 0) / 100);
  }
  return formData.discount || 0;
});

const taxableAmount = computed(() => subtotal.value - discountAmount.value);
const taxAmount = computed(() => taxableAmount.value * ((formData.taxRate || 0) / 100));
const finalTotal = computed(() => taxableAmount.value + taxAmount.value);

const addCustomSection = () => {
  const newSection: CustomSection = {
    id: `custom_${Date.now()}`,
    title: 'New Section',
    content: ''
  };
  formData.customSections.push(newSection);
  formData.stepOrder.push(newSection.id);
  activeStep.value = newSection.id;
};

const removeCustomSection = (index: number, id: string) => {
  if (confirm('Are you sure you want to delete this custom section?')) {
    formData.customSections.splice(index, 1);
    const orderIndex = formData.stepOrder.indexOf(id);
    if (orderIndex > -1) {
      formData.stepOrder.splice(orderIndex, 1);
    }
    if (activeStep.value === id) {
      activeStep.value = 'branding';
    }
  }
};

const onCustomSectionReorder = () => {
  // Re-sync the stepOrder array to reflect the new customSections order
  const baseOrder = ['executive', 'solution', 'financial', 'legal']; // Assuming these are fixed at the top
  const customOrder = formData.customSections.map(s => s.id);
  
  // Create a new step order: default steps followed by custom steps
  // In a more complex app, custom sections could be dragged ANYWHERE, 
  // but for now, they are dragged among themselves at the bottom.
  formData.stepOrder = [...baseOrder, ...customOrder];
};

// --- Expose API for Parent Components ---
const getContent = () => {
  return formData;
};

const setContent = (content: any) => {
  if (content && typeof content === 'object') {
     Object.assign(formData, content);
  }
};

watch(formData, (newVal) => {
  emit('save', newVal);
}, { deep: true });

defineExpose({
  getContent,
  setContent
});

// Next steps: Build the Branding Form, Rich Text Editor integration etc.
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 20px;
}
.custom-scrollbar:hover::-webkit-scrollbar-thumb {
  background-color: #94a3b8;
}

/* Print styles: hide everything except preview */
@media print {
  header, aside, section:not([data-print-area]) {
    display: none !important;
  }
  main {
    display: block !important;
  }
  [data-print-area] {
    width: 100% !important;
    overflow: visible !important;
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    border: none !important;
    background: white !important;
  }
  [data-print-area] > div {
    transform: none !important;
  }
}
</style>
