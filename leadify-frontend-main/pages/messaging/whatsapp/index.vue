<template lang="pug">
.p-6.animate-entrance
  //- ─── Header ──────────────────────────────────────────────────────────
  .flex.items-center.justify-between.mb-6
    div
      h1.text-3xl.font-black.tracking-tight(style="color: var(--text-primary);") {{ $t('whatsappPage.title') || 'WhatsApp Business' }}
      p.text-sm.mt-1(style="color: var(--text-muted);") {{ $t('whatsappPage.subtitle') || 'Manage conversations, contacts, and templates' }}
    .flex.gap-2
      el-button(size="default" @click="importContacts" :loading="importing" style="border-radius: 12px;")
        Icon(name="ph:download-simple" size="16" style="margin-inline-end: 4px;")
        | {{ $t('whatsappPage.importContacts') || 'Import from CRM' }}
      el-button(type="primary" size="default" @click="showContactDialog = true" style="background: #25D366; border: none; border-radius: 12px;")
        Icon(name="ph:plus" size="16" style="margin-inline-end: 4px;")
        | {{ $t('whatsappPage.newContact') || 'New Contact' }}

  //- ─── Stats Cards ─────────────────────────────────────────────────────
  .grid.grid-cols-2.gap-4.mb-6(class="md:grid-cols-4")
    .p-4.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('whatsappPage.stats.totalContacts') || 'Total Contacts' }}
      p.text-2xl.font-black.mt-1(style="color: #25D366;") {{ analytics.totalContacts || 0 }}
    .p-4.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('whatsappPage.stats.messagesToday') || 'Messages Today' }}
      p.text-2xl.font-black.mt-1(style="color: var(--text-primary);") {{ analytics.messagesToday || 0 }}
    .p-4.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('whatsappPage.stats.unreadMessages') || 'Unread' }}
      p.text-2xl.font-black.mt-1(style="color: #e74c3c;") {{ analytics.unreadMessages || 0 }}
    .p-4.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('whatsappPage.stats.responseRate') || 'Response Rate' }}
      p.text-2xl.font-black.mt-1(style="color: #7c3aed;") {{ analytics.responseRate || 0 }}%

  //- ─── Tab Navigation ──────────────────────────────────────────────────
  el-tabs(v-model="activeTab" @tab-click="onTabChange")
    //- ═══════════════════════════════════════════════════════════════════
    //- CONVERSATIONS TAB
    //- ═══════════════════════════════════════════════════════════════════
    el-tab-pane(:label="$t('whatsappPage.tabs.conversations') || 'Conversations'" name="conversations")
      .flex.gap-4(style="min-height: 520px;")
        //- Contact sidebar
        .w-80.flex-shrink-0.border.rounded-2xl.overflow-hidden(style="border-color: var(--border-default); background: var(--bg-elevated);")
          .p-3.border-b(style="border-color: var(--border-default);")
            el-input(
              v-model="contactSearch"
              :placeholder="$t('whatsappPage.common.search') || 'Search...'"
              prefix-icon="Search"
              clearable
              size="default"
              @input="debouncedLoadContacts"
            )
          .overflow-y-auto(style="max-height: 470px;")
            .p-3.cursor-pointer.border-b.transition-all(
              v-for="c in contacts"
              :key="c.id"
              :class="{ 'bg-green-50': selectedContact?.id === c.id }"
              :style="selectedContact?.id === c.id ? 'background: rgba(37,211,102,0.08); border-color: var(--border-default);' : 'border-color: var(--border-default);'"
              @click="selectContact(c)"
            )
              .flex.items-center.justify-between
                .flex.items-center.gap-2.min-w-0
                  .w-9.h-9.rounded-full.flex.items-center.justify-center.text-white.font-bold.text-sm.flex-shrink-0(style="background: #25D366;") {{ (c.name || c.phoneNumber || '?')[0].toUpperCase() }}
                  .min-w-0
                    p.text-sm.font-semibold.truncate(style="color: var(--text-primary);") {{ c.name || c.phoneNumber }}
                    p.text-xs.truncate(style="color: var(--text-muted);") {{ c.phoneNumber }}
                .flex.flex-col.items-end.gap-1.flex-shrink-0
                  span.text-xs(v-if="c.lastMessageAt" style="color: var(--text-muted);") {{ formatTime(c.lastMessageAt) }}
                  el-badge(v-if="c.unreadCount > 0" :value="c.unreadCount" type="danger")
            .p-8.text-center(v-if="!contacts.length && !contactsLoading")
              p.text-sm(style="color: var(--text-muted);") {{ $t('whatsappPage.contacts.noContacts') || 'No contacts yet.' }}

        //- Chat area
        .flex-1.border.rounded-2xl.overflow-hidden.flex.flex-col(style="border-color: var(--border-default); background: var(--bg-elevated);")
          template(v-if="selectedContact")
            //- Chat header
            .p-4.border-b.flex.items-center.justify-between(style="border-color: var(--border-default);")
              .flex.items-center.gap-3
                .w-10.h-10.rounded-full.flex.items-center.justify-center.text-white.font-bold(style="background: #25D366;") {{ (selectedContact.name || selectedContact.phoneNumber || '?')[0].toUpperCase() }}
                div
                  p.font-bold(style="color: var(--text-primary);") {{ selectedContact.name || selectedContact.phoneNumber }}
                  p.text-xs(style="color: var(--text-muted);") {{ selectedContact.phoneNumber }}
              .flex.gap-2
                el-button(size="small" text @click="markConversationRead")
                  Icon(name="ph:checks" size="16")
                el-dropdown(trigger="click")
                  el-button(size="small" text)
                    Icon(name="ph:dots-three-vertical" size="16")
                  template(#dropdown)
                    el-dropdown-menu
                      el-dropdown-item(@click="openSendMediaDialog") {{ $t('whatsappPage.messages.sendMedia') || 'Send Media' }}
                      el-dropdown-item(@click="openSendTemplateDialog") {{ $t('whatsappPage.messages.sendTemplate') || 'Send Template' }}
                      el-dropdown-item(divided @click="editSelectedContact") {{ $t('whatsappPage.contacts.editContact') || 'Edit Contact' }}

            //- Messages area
            .flex-1.overflow-y-auto.p-4.space-y-3(ref="chatArea" style="background: var(--bg-default);")
              .text-center.py-8(v-if="messagesLoading")
                el-icon.is-loading(size="24")
                  Icon(name="ph:spinner" size="24")
              template(v-else)
                .text-center.py-8(v-if="!chatMessages.length")
                  Icon(name="ph:chat-circle-dots" size="48" style="color: var(--text-muted);")
                  p.text-sm.mt-2(style="color: var(--text-muted);") {{ $t('whatsappPage.messages.noMessages') || 'No messages yet. Start a conversation!' }}
                .flex(
                  v-for="msg in chatMessages"
                  :key="msg.id"
                  :class="msg.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'"
                )
                  .max-w-xs.rounded-2xl.p-3.shadow-sm(
                    :class="msg.direction === 'OUTBOUND' ? 'rounded-br-sm' : 'rounded-bl-sm'"
                    :style="msg.direction === 'OUTBOUND' ? 'background: #dcf8c6;' : 'background: var(--bg-elevated); border: 1px solid var(--border-default);'"
                  )
                    //- Media indicator
                    .flex.items-center.gap-1.mb-1(v-if="msg.type !== 'TEXT' && msg.type !== 'TEMPLATE'")
                      Icon(:name="getMediaIcon(msg.type)" size="14" style="color: var(--text-muted);")
                      span.text-xs.font-semibold(style="color: var(--text-muted);") {{ msg.type }}
                    //- Template badge
                    .mb-1(v-if="msg.type === 'TEMPLATE'")
                      el-tag(size="small" type="info" round) {{ msg.templateName || 'Template' }}
                    p.text-sm(style="color: var(--text-primary); word-break: break-word;") {{ msg.content }}
                    .flex.items-center.justify-end.gap-1.mt-1
                      span.text-xs(style="color: var(--text-muted);") {{ formatTime(msg.createdAt) }}
                      Icon(
                        v-if="msg.direction === 'OUTBOUND'"
                        :name="getStatusIcon(msg.status)"
                        size="14"
                        :style="msg.status === 'READ' ? 'color: #25D366;' : 'color: var(--text-muted);'"
                      )

            //- Message input
            .p-4.border-t(style="border-color: var(--border-default);")
              .flex.gap-2
                el-input(
                  v-model="newMessage"
                  :placeholder="$t('whatsappPage.messages.typeMessage') || 'Type a message...'"
                  size="large"
                  @keyup.enter="sendTextMessage"
                  clearable
                )
                el-button(
                  type="primary"
                  size="large"
                  :loading="sendingMessage"
                  :disabled="!newMessage.trim()"
                  @click="sendTextMessage"
                  style="background: #25D366; border: none; border-radius: 12px; min-width: 100px;"
                )
                  Icon(name="ph:paper-plane-tilt" size="16" style="margin-inline-end: 4px;")
                  | {{ $t('whatsappPage.messages.send') || 'Send' }}

          //- No contact selected
          .flex-1.flex.items-center.justify-center(v-else)
            .text-center
              Icon(name="ph:whatsapp-logo" size="64" style="color: #25D366; opacity: 0.3;")
              p.text-sm.mt-3(style="color: var(--text-muted);") {{ $t('whatsappPage.messages.selectContact') || 'Select a contact to start chatting' }}

    //- ═══════════════════════════════════════════════════════════════════
    //- CONTACTS TAB
    //- ═══════════════════════════════════════════════════════════════════
    el-tab-pane(:label="$t('whatsappPage.tabs.contacts') || 'Contacts'" name="contacts")
      .mb-4.flex.items-center.gap-3
        el-input(
          v-model="contactSearch"
          :placeholder="$t('whatsappPage.common.search') || 'Search...'"
          prefix-icon="Search"
          clearable
          style="max-width: 320px;"
          @input="debouncedLoadContacts"
        )
        el-select(v-model="contactStatusFilter" placeholder="Status" clearable style="width: 150px;" @change="loadContacts")
          el-option(label="Active" value="ACTIVE")
          el-option(label="Blocked" value="BLOCKED")
          el-option(label="Archived" value="ARCHIVED")
      el-card.rounded-2xl(shadow="never" style="border: 1px solid var(--border-default);" v-loading="contactsLoading")
        el-table(:data="contacts" style="width: 100%" :empty-text="$t('whatsappPage.contacts.noContacts') || 'No WhatsApp contacts yet.'")
          el-table-column(:label="$t('whatsappPage.contacts.name') || 'Name'" min-width="180")
            template(#default="{ row }")
              .flex.items-center.gap-2
                .w-8.h-8.rounded-full.flex.items-center.justify-center.text-white.font-bold.text-xs(style="background: #25D366;") {{ (row.name || row.phoneNumber || '?')[0].toUpperCase() }}
                div
                  p.text-sm.font-semibold {{ row.name || '-' }}
                  p.text-xs(style="color: var(--text-muted);") {{ row.client?.clientName || '' }}
          el-table-column(:label="$t('whatsappPage.contacts.phone') || 'Phone'" min-width="160")
            template(#default="{ row }")
              span.text-sm.font-mono {{ row.phoneNumber }}
          el-table-column(:label="$t('whatsappPage.contacts.status') || 'Status'" width="120")
            template(#default="{ row }")
              el-tag(
                :type="row.status === 'ACTIVE' ? 'success' : row.status === 'BLOCKED' ? 'danger' : 'info'"
                size="small"
                round
              ) {{ row.status }}
          el-table-column(:label="$t('whatsappPage.contacts.tags') || 'Tags'" min-width="180")
            template(#default="{ row }")
              el-tag(v-for="tag in (row.tags || [])" :key="tag" size="small" style="margin: 2px;" round) {{ tag }}
              span.text-gray-400(v-if="!row.tags?.length") -
          el-table-column(:label="$t('whatsappPage.contacts.unread') || 'Unread'" width="90" align="center")
            template(#default="{ row }")
              el-badge(v-if="row.unreadCount > 0" :value="row.unreadCount" type="danger")
              span(v-else) 0
          el-table-column(:label="$t('whatsappPage.contacts.actions') || 'Actions'" width="140" align="center")
            template(#default="{ row }")
              .flex.gap-1.justify-center
                el-button(size="small" text type="primary" @click="openChat(row)")
                  Icon(name="ph:chat-circle" size="16")
                el-button(size="small" text type="warning" @click="editContact(row)")
                  Icon(name="ph:pencil-simple" size="16")
                el-popconfirm(
                  :title="$t('whatsappPage.contacts.deleteConfirm') || 'Delete this contact?'"
                  @confirm="deleteContact(row.id)"
                )
                  template(#reference)
                    el-button(size="small" text type="danger")
                      Icon(name="ph:trash" size="16")

        //- Pagination
        .flex.justify-center.mt-4(v-if="contactsPagination.totalPages > 1")
          el-pagination(
            layout="prev, pager, next"
            :total="contactsPagination.totalItems"
            :page-size="contactsPagination.limit"
            :current-page="contactsPagination.page"
            @current-change="handleContactPageChange"
          )

    //- ═══════════════════════════════════════════════════════════════════
    //- TEMPLATES TAB
    //- ═══════════════════════════════════════════════════════════════════
    el-tab-pane(:label="$t('whatsappPage.tabs.templates') || 'Templates'" name="templates")
      .mb-4.flex.items-center.justify-between
        .flex.gap-3
          el-input(
            v-model="templateSearch"
            :placeholder="$t('whatsappPage.common.search') || 'Search...'"
            prefix-icon="Search"
            clearable
            style="max-width: 280px;"
            @input="debouncedLoadTemplates"
          )
          el-select(v-model="templateCategoryFilter" placeholder="Category" clearable style="width: 160px;" @change="loadTemplates")
            el-option(label="Marketing" value="MARKETING")
            el-option(label="Utility" value="UTILITY")
            el-option(label="Authentication" value="AUTHENTICATION")
        el-button(type="primary" @click="openTemplateDialog()" style="background: #25D366; border: none; border-radius: 12px;")
          Icon(name="ph:plus" size="16" style="margin-inline-end: 4px;")
          | {{ $t('whatsappPage.templates.addTemplate') || 'Create Template' }}

      el-card.rounded-2xl(shadow="never" style="border: 1px solid var(--border-default);" v-loading="templatesLoading")
        el-table(:data="templates" style="width: 100%" :empty-text="$t('whatsappPage.templates.noTemplates') || 'No templates yet.'")
          el-table-column(:label="$t('whatsappPage.templates.name') || 'Template Name'" min-width="180")
            template(#default="{ row }")
              p.text-sm.font-bold {{ row.name }}
          el-table-column(:label="$t('whatsappPage.templates.category') || 'Category'" width="140")
            template(#default="{ row }")
              el-tag(
                :type="row.category === 'MARKETING' ? 'warning' : row.category === 'AUTHENTICATION' ? 'danger' : 'info'"
                size="small"
                round
              ) {{ row.category }}
          el-table-column(:label="$t('whatsappPage.templates.language') || 'Language'" width="100")
            template(#default="{ row }")
              span.text-sm {{ row.language || 'en' }}
          el-table-column(:label="$t('whatsappPage.templates.content') || 'Content'" min-width="300")
            template(#default="{ row }")
              p.text-sm.line-clamp-2(style="color: var(--text-muted);") {{ row.content }}
          el-table-column(:label="$t('whatsappPage.templates.status') || 'Status'" width="120")
            template(#default="{ row }")
              el-tag(
                :type="row.status === 'APPROVED' ? 'success' : row.status === 'REJECTED' ? 'danger' : 'warning'"
                size="small"
                round
              ) {{ row.status }}
          el-table-column(label="" width="120" align="center")
            template(#default="{ row }")
              .flex.gap-1.justify-center
                el-button(size="small" text type="primary" @click="openTemplateDialog(row)")
                  Icon(name="ph:pencil-simple" size="16")
                el-popconfirm(
                  :title="$t('whatsappPage.templates.deleteConfirm') || 'Delete this template?'"
                  @confirm="deleteTemplate(row.id)"
                )
                  template(#reference)
                    el-button(size="small" text type="danger")
                      Icon(name="ph:trash" size="16")

    //- ═══════════════════════════════════════════════════════════════════
    //- ANALYTICS TAB
    //- ═══════════════════════════════════════════════════════════════════
    el-tab-pane(:label="$t('whatsappPage.tabs.analytics') || 'Analytics'" name="analytics")
      .grid.grid-cols-2.gap-4(class="md:grid-cols-4 lg:grid-cols-5")
        .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
          p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('whatsappPage.stats.totalSent') || 'Sent' }}
          p.text-3xl.font-black.mt-1(style="color: #25D366;") {{ analytics.totalSent || 0 }}
        .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
          p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('whatsappPage.stats.totalReceived') || 'Received' }}
          p.text-3xl.font-black.mt-1(style="color: var(--text-primary);") {{ analytics.totalReceived || 0 }}
        .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
          p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('whatsappPage.stats.totalFailed') || 'Failed' }}
          p.text-3xl.font-black.mt-1(style="color: #e74c3c;") {{ analytics.totalFailed || 0 }}
        .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
          p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('whatsappPage.stats.templateMessages') || 'Template Messages' }}
          p.text-3xl.font-black.mt-1(style="color: #7c3aed;") {{ analytics.templateMessages || 0 }}
        .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
          p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('whatsappPage.stats.messagesThisWeek') || 'This Week' }}
          p.text-3xl.font-black.mt-1(style="color: #f59e0b;") {{ analytics.messagesThisWeek || 0 }}
        .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
          p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('whatsappPage.stats.activeContacts') || 'Active Contacts' }}
          p.text-3xl.font-black.mt-1(style="color: #25D366;") {{ analytics.activeContacts || 0 }}
        .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
          p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('whatsappPage.stats.responseRate') || 'Response Rate' }}
          p.text-3xl.font-black.mt-1(style="color: #7c3aed;") {{ analytics.responseRate || 0 }}%

  //- ═══════════════════════════════════════════════════════════════════
  //- DIALOGS
  //- ═══════════════════════════════════════════════════════════════════

  //- Contact Dialog
  el-dialog(
    v-model="showContactDialog"
    :title="contactDialogTitle"
    width="500px"
  )
    el-form(label-position="top" size="large")
      .grid.grid-cols-1.gap-4(class="md:grid-cols-2")
        el-form-item(:label="$t('whatsappPage.contacts.phone') || 'Phone Number'" required)
          el-input(v-model="contactForm.phoneNumber" placeholder="+966501234567" :disabled="!!editingContact")
        el-form-item(:label="$t('whatsappPage.contacts.name') || 'Name'")
          el-input(v-model="contactForm.name")
      el-form-item(:label="$t('whatsappPage.contacts.status') || 'Status'" v-if="editingContact")
        el-select(v-model="contactForm.status" style="width: 100%;")
          el-option(label="Active" value="ACTIVE")
          el-option(label="Blocked" value="BLOCKED")
          el-option(label="Archived" value="ARCHIVED")
      el-form-item(:label="$t('whatsappPage.contacts.tags') || 'Tags'")
        el-select(v-model="contactForm.tags" multiple filterable allow-create default-first-option style="width: 100%;" placeholder="Add tags...")
    template(#footer)
      el-button(@click="showContactDialog = false") {{ $t('whatsappPage.common.cancel') || 'Cancel' }}
      el-button(type="primary" :loading="savingContact" @click="saveContact" style="background: #25D366; border: none; border-radius: 12px;") {{ $t('whatsappPage.common.save') || 'Save' }}

  //- Template Dialog
  el-dialog(
    v-model="showTemplateDialog"
    :title="templateDialogTitle"
    width="600px"
  )
    el-form(label-position="top" size="large")
      .grid.grid-cols-1.gap-4(class="md:grid-cols-2")
        el-form-item(:label="$t('whatsappPage.templates.name') || 'Template Name'" required)
          el-input(v-model="templateForm.name")
        el-form-item(:label="$t('whatsappPage.templates.language') || 'Language'")
          el-select(v-model="templateForm.language" style="width: 100%;")
            el-option(label="English" value="en")
            el-option(label="Arabic" value="ar")
      el-form-item(:label="$t('whatsappPage.templates.category') || 'Category'")
        el-select(v-model="templateForm.category" style="width: 100%;")
          el-option(label="Marketing" value="MARKETING")
          el-option(label="Utility" value="UTILITY")
          el-option(label="Authentication" value="AUTHENTICATION")
      el-form-item(:label="$t('whatsappPage.templates.content') || 'Content'" required)
        el-input(v-model="templateForm.content" type="textarea" :rows="5" :placeholder="templatePlaceholderExample")
        p.text-xs.mt-1(style="color: var(--text-muted);") {{ placeholderHelpText }}
      .grid.grid-cols-1.gap-4(class="md:grid-cols-2")
        el-form-item(:label="$t('whatsappPage.templates.headerType') || 'Header Type'")
          el-select(v-model="templateForm.headerType" style="width: 100%;")
            el-option(label="None" value="NONE")
            el-option(label="Text" value="TEXT")
            el-option(label="Image" value="IMAGE")
            el-option(label="Document" value="DOCUMENT")
        el-form-item(:label="$t('whatsappPage.templates.headerContent') || 'Header Content'" v-if="templateForm.headerType !== 'NONE'")
          el-input(v-model="templateForm.headerContent")
      el-form-item(:label="$t('whatsappPage.templates.footerText') || 'Footer Text'")
        el-input(v-model="templateForm.footerText")
    template(#footer)
      el-button(@click="showTemplateDialog = false") {{ $t('whatsappPage.common.cancel') || 'Cancel' }}
      el-button(type="primary" :loading="savingTemplate" @click="saveTemplate" style="background: #25D366; border: none; border-radius: 12px;") {{ $t('whatsappPage.common.save') || 'Save' }}

  //- Send Media Dialog
  el-dialog(
    v-model="showMediaDialog"
    :title="$t('whatsappPage.messages.sendMedia') || 'Send Media'"
    width="500px"
  )
    el-form(label-position="top" size="large")
      el-form-item(:label="$t('whatsappPage.messages.mediaType') || 'Media Type'")
        el-select(v-model="mediaForm.type" style="width: 100%;")
          el-option(label="Image" value="IMAGE")
          el-option(label="Document" value="DOCUMENT")
          el-option(label="Audio" value="AUDIO")
          el-option(label="Video" value="VIDEO")
      el-form-item(:label="$t('whatsappPage.messages.mediaUrl') || 'Media URL'" required)
        el-input(v-model="mediaForm.mediaUrl" placeholder="https://...")
      el-form-item(:label="$t('whatsappPage.messages.mediaCaption') || 'Caption'")
        el-input(v-model="mediaForm.mediaCaption" type="textarea" :rows="2")
      el-form-item(:label="$t('whatsappPage.messages.fileName') || 'File Name'" v-if="mediaForm.type === 'DOCUMENT'")
        el-input(v-model="mediaForm.fileName" placeholder="invoice.pdf")
    template(#footer)
      el-button(@click="showMediaDialog = false") {{ $t('whatsappPage.common.cancel') || 'Cancel' }}
      el-button(type="primary" :loading="sendingMessage" @click="sendMediaMessage" style="background: #25D366; border: none; border-radius: 12px;") {{ $t('whatsappPage.messages.send') || 'Send' }}

  //- Send Template Dialog
  el-dialog(
    v-model="showSendTemplateDialog"
    :title="$t('whatsappPage.messages.sendTemplate') || 'Send Template'"
    width="500px"
  )
    el-form(label-position="top" size="large")
      el-form-item(:label="$t('whatsappPage.messages.chooseTemplate') || 'Choose Template'" required)
        el-select(v-model="sendTemplateForm.templateId" style="width: 100%;" filterable)
          el-option(v-for="tpl in templates" :key="tpl.id" :label="tpl.name" :value="tpl.id")
            span {{ tpl.name }}
            span.text-xs.ms-2(style="color: var(--text-muted);") ({{ tpl.category }})
      .rounded-xl.p-3.mb-3(v-if="selectedTemplate" style="background: var(--bg-default); border: 1px solid var(--border-default);")
        p.text-sm {{ selectedTemplate.content }}
      el-form-item(:label="$t('whatsappPage.messages.templateVars') || 'Template Variables'" v-if="templateVarKeys.length")
        .grid.grid-cols-2.gap-2
          el-input(
            v-for="key in templateVarKeys"
            :key="key"
            v-model="sendTemplateForm.variables[key]"
            :placeholder="'Value for {{' + key + '}}'"
            size="default"
          )
    template(#footer)
      el-button(@click="showSendTemplateDialog = false") {{ $t('whatsappPage.common.cancel') || 'Cancel' }}
      el-button(type="primary" :loading="sendingMessage" @click="sendTemplateMessage" style="background: #25D366; border: none; border-radius: 12px;") {{ $t('whatsappPage.messages.send') || 'Send' }}
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue';
import { useApiFetch } from '~/composables/useApiFetch';

const { $i18n } = useNuxtApp();
const _t = $i18n.t;
const templatePlaceholderExample = 'Hello {1}, your order {2} is ready.';
const placeholderHelpText = computed(() => _t('whatsappPage.templates.placeholderHelp') || 'Use {1}, {2} for placeholders');

// ─── Types ──────────────────────────────────────────────────────────────────

interface WAContact {
  id: string;
  phoneNumber: string;
  name?: string;
  profilePicUrl?: string;
  clientId?: string;
  client?: { id: string; clientName: string; email?: string };
  lastMessageAt?: string;
  unreadCount: number;
  status: string;
  tags: string[];
}

interface WAMessage {
  id: string;
  contactId: string;
  direction: string;
  content: string;
  type: string;
  mediaUrl?: string;
  mediaCaption?: string;
  fileName?: string;
  status: string;
  templateName?: string;
  metadata?: Record<string, any>;
  sender?: { id: number; name: string; profilePicture?: string };
  createdAt: string;
}

interface WATemplate {
  id: string;
  name: string;
  language: string;
  category: string;
  content: string;
  headerType: string;
  headerContent?: string;
  footerText?: string;
  buttons: any[];
  status: string;
}

interface Pagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

// ─── State ──────────────────────────────────────────────────────────────────

const activeTab = ref('conversations');
const contactSearch = ref('');
const contactStatusFilter = ref('');
const templateSearch = ref('');
const templateCategoryFilter = ref('');

// Contacts
const contacts = ref<WAContact[]>([]);
const contactsLoading = ref(false);
const contactsPagination = ref<Pagination>({ page: 1, limit: 25, totalItems: 0, totalPages: 0 });
const selectedContact = ref<WAContact | null>(null);

// Messages
const chatMessages = ref<WAMessage[]>([]);
const messagesLoading = ref(false);
const newMessage = ref('');
const sendingMessage = ref(false);
const chatArea = ref<HTMLElement | null>(null);

// Templates
const templates = ref<WATemplate[]>([]);
const templatesLoading = ref(false);

// Analytics
const analytics = ref<Record<string, number>>({});

// Dialogs
const showContactDialog = ref(false);
const editingContact = ref<WAContact | null>(null);
const savingContact = ref(false);
const contactForm = reactive({
  phoneNumber: '',
  name: '',
  status: 'ACTIVE',
  tags: [] as string[]
});

const contactDialogTitle = computed(() =>
  editingContact.value
    ? (_t('whatsappPage.contacts.editContact') || 'Edit Contact')
    : (_t('whatsappPage.contacts.addContact') || 'Add Contact')
);

const showTemplateDialog = ref(false);
const editingTemplate = ref<WATemplate | null>(null);
const templateDialogTitle = computed(() =>
  editingTemplate.value
    ? (_t('whatsappPage.templates.editTemplate') || 'Edit Template')
    : (_t('whatsappPage.templates.addTemplate') || 'Create Template')
);
const savingTemplate = ref(false);
const templateForm = reactive({
  name: '',
  language: 'en',
  category: 'UTILITY',
  content: '',
  headerType: 'NONE',
  headerContent: '',
  footerText: ''
});

const showMediaDialog = ref(false);
const mediaForm = reactive({
  type: 'DOCUMENT',
  mediaUrl: '',
  mediaCaption: '',
  fileName: ''
});

const showSendTemplateDialog = ref(false);
const sendTemplateForm = reactive({
  templateId: '',
  variables: {} as Record<string, string>
});

const importing = ref(false);

// ─── Computed ───────────────────────────────────────────────────────────────

const selectedTemplate = computed(() => {
  return templates.value.find(t => t.id === sendTemplateForm.templateId) || null;
});

const templateVarKeys = computed(() => {
  if (!selectedTemplate.value) return [];
  const matches = selectedTemplate.value.content.match(/\{\{(\w+)\}\}/g) || [];
  return [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '')))];
});

// ─── Debounce ───────────────────────────────────────────────────────────────

let contactDebounce: ReturnType<typeof setTimeout>;
function debouncedLoadContacts() {
  clearTimeout(contactDebounce);
  contactDebounce = setTimeout(() => loadContacts(), 300);
}

let templateDebounce: ReturnType<typeof setTimeout>;
function debouncedLoadTemplates() {
  clearTimeout(templateDebounce);
  templateDebounce = setTimeout(() => loadTemplates(), 300);
}

// ─── Data Loading ───────────────────────────────────────────────────────────

async function loadContacts(page: number = 1) {
  contactsLoading.value = true;
  try {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', '25');
    if (contactSearch.value) params.set('search', contactSearch.value);
    if (contactStatusFilter.value) params.set('status', contactStatusFilter.value);

    const { body, success } = await useApiFetch(`whatsapp/contacts?${params.toString()}`);
    if (success && body) {
      const data = body as any;
      contacts.value = data.docs || [];
      if (data.pagination) {
        contactsPagination.value = data.pagination;
      }
    }
  } finally {
    contactsLoading.value = false;
  }
}

async function loadMessages(contactId: string) {
  messagesLoading.value = true;
  try {
    const { body, success } = await useApiFetch(`whatsapp/messages/${contactId}?limit=100`);
    if (success && body) {
      const data = body as any;
      chatMessages.value = data.docs || [];
      await nextTick();
      scrollToBottom();
    }
  } finally {
    messagesLoading.value = false;
  }
}

async function loadTemplates(page: number = 1) {
  templatesLoading.value = true;
  try {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', '25');
    if (templateSearch.value) params.set('search', templateSearch.value);
    if (templateCategoryFilter.value) params.set('category', templateCategoryFilter.value);

    const { body, success } = await useApiFetch(`whatsapp/templates?${params.toString()}`);
    if (success && body) {
      const data = body as any;
      templates.value = data.docs || [];
    }
  } finally {
    templatesLoading.value = false;
  }
}

async function loadAnalytics() {
  const { body, success } = await useApiFetch('whatsapp/analytics');
  if (success && body) {
    analytics.value = body as any;
  }
}

// ─── Contact Actions ────────────────────────────────────────────────────────

function selectContact(contact: WAContact) {
  selectedContact.value = contact;
  loadMessages(contact.id);
}

function openChat(contact: WAContact) {
  activeTab.value = 'conversations';
  selectContact(contact);
}

function editContact(contact: WAContact) {
  editingContact.value = contact;
  Object.assign(contactForm, {
    phoneNumber: contact.phoneNumber,
    name: contact.name || '',
    status: contact.status,
    tags: [...(contact.tags || [])]
  });
  showContactDialog.value = true;
}

function editSelectedContact() {
  if (selectedContact.value) {
    editContact(selectedContact.value);
  }
}

async function saveContact() {
  savingContact.value = true;
  try {
    if (editingContact.value) {
      const { success } = await useApiFetch(`whatsapp/contacts/${editingContact.value.id}`, 'PUT', {
        name: contactForm.name,
        status: contactForm.status,
        tags: contactForm.tags
      });
      if (success) {
        ElMessage.success('Contact updated');
        showContactDialog.value = false;
        loadContacts();
      }
    } else {
      if (!contactForm.phoneNumber.trim()) {
        ElMessage.warning('Phone number is required');
        return;
      }
      const { success } = await useApiFetch('whatsapp/contacts', 'POST', {
        phoneNumber: contactForm.phoneNumber,
        name: contactForm.name,
        tags: contactForm.tags
      });
      if (success) {
        ElMessage.success('Contact created');
        showContactDialog.value = false;
        loadContacts();
      }
    }
  } finally {
    savingContact.value = false;
  }
}

async function deleteContact(id: string) {
  const { success } = await useApiFetch(`whatsapp/contacts/${id}`, 'DELETE');
  if (success) {
    ElMessage.success('Contact deleted');
    if (selectedContact.value?.id === id) {
      selectedContact.value = null;
      chatMessages.value = [];
    }
    loadContacts();
  }
}

async function importContacts() {
  importing.value = true;
  try {
    const { body, success } = await useApiFetch('whatsapp/contacts/import', 'POST');
    if (success && body) {
      const data = body as any;
      ElMessage.success(`Imported: ${data.imported}, Skipped: ${data.skipped}`);
      loadContacts();
    }
  } finally {
    importing.value = false;
  }
}

function handleContactPageChange(page: number) {
  loadContacts(page);
}

// ─── Message Actions ────────────────────────────────────────────────────────

async function sendTextMessage() {
  if (!newMessage.value.trim() || !selectedContact.value) return;
  sendingMessage.value = true;
  try {
    const { body, success } = await useApiFetch('whatsapp/messages/send/text', 'POST', {
      contactId: selectedContact.value.id,
      content: newMessage.value
    });
    if (success && body) {
      chatMessages.value.push(body as any);
      newMessage.value = '';
      await nextTick();
      scrollToBottom();
    }
  } finally {
    sendingMessage.value = false;
  }
}

function openSendMediaDialog() {
  Object.assign(mediaForm, { type: 'DOCUMENT', mediaUrl: '', mediaCaption: '', fileName: '' });
  showMediaDialog.value = true;
}

async function sendMediaMessage() {
  if (!mediaForm.mediaUrl.trim() || !selectedContact.value) return;
  sendingMessage.value = true;
  try {
    const { body, success } = await useApiFetch('whatsapp/messages/send/media', 'POST', {
      contactId: selectedContact.value.id,
      content: mediaForm.mediaCaption || '',
      type: mediaForm.type,
      mediaUrl: mediaForm.mediaUrl,
      mediaCaption: mediaForm.mediaCaption,
      fileName: mediaForm.fileName
    });
    if (success && body) {
      chatMessages.value.push(body as any);
      showMediaDialog.value = false;
      await nextTick();
      scrollToBottom();
    }
  } finally {
    sendingMessage.value = false;
  }
}

function openSendTemplateDialog() {
  Object.assign(sendTemplateForm, { templateId: '', variables: {} });
  if (!templates.value.length) loadTemplates();
  showSendTemplateDialog.value = true;
}

async function sendTemplateMessage() {
  if (!sendTemplateForm.templateId || !selectedContact.value) return;
  sendingMessage.value = true;
  try {
    const { body, success } = await useApiFetch('whatsapp/messages/send/template', 'POST', {
      contactId: selectedContact.value.id,
      templateId: sendTemplateForm.templateId,
      variables: sendTemplateForm.variables
    });
    if (success && body) {
      chatMessages.value.push(body as any);
      showSendTemplateDialog.value = false;
      await nextTick();
      scrollToBottom();
    }
  } finally {
    sendingMessage.value = false;
  }
}

async function markConversationRead() {
  if (!selectedContact.value) return;
  await useApiFetch(`whatsapp/messages/read/${selectedContact.value.id}`, 'PUT');
  if (selectedContact.value) {
    selectedContact.value.unreadCount = 0;
  }
}

// ─── Template Actions ───────────────────────────────────────────────────────

function openTemplateDialog(tpl?: WATemplate) {
  if (tpl) {
    editingTemplate.value = tpl;
    Object.assign(templateForm, {
      name: tpl.name,
      language: tpl.language || 'en',
      category: tpl.category,
      content: tpl.content,
      headerType: tpl.headerType || 'NONE',
      headerContent: tpl.headerContent || '',
      footerText: tpl.footerText || ''
    });
  } else {
    editingTemplate.value = null;
    Object.assign(templateForm, {
      name: '',
      language: 'en',
      category: 'UTILITY',
      content: '',
      headerType: 'NONE',
      headerContent: '',
      footerText: ''
    });
  }
  showTemplateDialog.value = true;
}

async function saveTemplate() {
  if (!templateForm.name.trim() || !templateForm.content.trim()) {
    ElMessage.warning('Name and content are required');
    return;
  }
  savingTemplate.value = true;
  try {
    const payload = { ...templateForm };
    if (editingTemplate.value) {
      const { success } = await useApiFetch(`whatsapp/templates/${editingTemplate.value.id}`, 'PUT', payload);
      if (success) {
        ElMessage.success('Template updated');
        showTemplateDialog.value = false;
        loadTemplates();
      }
    } else {
      const { success } = await useApiFetch('whatsapp/templates', 'POST', payload);
      if (success) {
        ElMessage.success('Template created');
        showTemplateDialog.value = false;
        loadTemplates();
      }
    }
  } finally {
    savingTemplate.value = false;
  }
}

async function deleteTemplate(id: string) {
  const { success } = await useApiFetch(`whatsapp/templates/${id}`, 'DELETE');
  if (success) {
    ElMessage.success('Template deleted');
    loadTemplates();
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function scrollToBottom() {
  if (chatArea.value) {
    chatArea.value.scrollTop = chatArea.value.scrollHeight;
  }
}

function formatTime(dateStr: string | undefined): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function getStatusIcon(status: string): string {
  switch (status) {
    case 'READ': return 'ph:checks';
    case 'DELIVERED': return 'ph:checks';
    case 'SENT': return 'ph:check';
    case 'FAILED': return 'ph:x-circle';
    default: return 'ph:clock';
  }
}

function getMediaIcon(type: string): string {
  switch (type) {
    case 'IMAGE': return 'ph:image';
    case 'DOCUMENT': return 'ph:file-text';
    case 'AUDIO': return 'ph:microphone';
    case 'VIDEO': return 'ph:video-camera';
    case 'LOCATION': return 'ph:map-pin';
    default: return 'ph:file';
  }
}

function onTabChange() {
  if (activeTab.value === 'templates' && !templates.value.length) {
    loadTemplates();
  }
  if (activeTab.value === 'analytics') {
    loadAnalytics();
  }
}

// ─── Watchers ───────────────────────────────────────────────────────────────

watch(showContactDialog, (val) => {
  if (!val) {
    editingContact.value = null;
    Object.assign(contactForm, { phoneNumber: '', name: '', status: 'ACTIVE', tags: [] });
  }
});

watch(() => sendTemplateForm.templateId, () => {
  sendTemplateForm.variables = {};
});

// ─── Init ───────────────────────────────────────────────────────────────────

onMounted(() => {
  loadContacts();
  loadAnalytics();
});
</script>
