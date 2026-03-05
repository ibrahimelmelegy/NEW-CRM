<template lang="pug">
.p-6.animate-entrance
  //- ─── Header ──────────────────────────────────────────────────────────
  .flex.items-center.justify-between.mb-6
    div
      h1.text-3xl.font-black.tracking-tight(style="color: var(--text-primary);") {{ $t('whatsappPage.title') }}
      p.text-sm.mt-1(style="color: var(--text-muted);") {{ $t('whatsappPage.subtitle') }}
    .flex.gap-2
      el-button(size="default" @click="exportConversations" :loading="exporting" style="border-radius: 12px;")
        Icon(name="ph:export" size="16" style="margin-inline-end: 4px;")
        | {{ $t('whatsappPage.exportHistory') }}
      el-button(size="default" @click="importContacts" :loading="importing" style="border-radius: 12px;")
        Icon(name="ph:download-simple" size="16" style="margin-inline-end: 4px;")
        | {{ $t('whatsappPage.importContacts') }}
      el-button(type="primary" size="default" @click="showBulkSendDialog = true" style="background: #128C7E; border: none; border-radius: 12px;")
        Icon(name="ph:users-three" size="16" style="margin-inline-end: 4px;")
        | {{ $t('whatsappPage.messages.bulkSend') }}
      el-button(type="primary" size="default" @click="showContactDialog = true" style="background: #25D366; border: none; border-radius: 12px;")
        Icon(name="ph:plus" size="16" style="margin-inline-end: 4px;")
        | {{ $t('whatsappPage.newContact') }}

  //- ─── Stats Cards ─────────────────────────────────────────────────────
  .grid.grid-cols-2.gap-4.mb-6(class="md:grid-cols-4")
    .p-4.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('whatsappPage.stats.totalContacts') }}
      p.text-2xl.font-black.mt-1(style="color: #25D366;") {{ analytics.totalContacts || 0 }}
    .p-4.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('whatsappPage.stats.messagesToday') }}
      p.text-2xl.font-black.mt-1(style="color: var(--text-primary);") {{ analytics.messagesToday || 0 }}
    .p-4.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('whatsappPage.stats.unreadMessages') }}
      p.text-2xl.font-black.mt-1(style="color: #e74c3c;") {{ analytics.unreadMessages || 0 }}
    .p-4.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('whatsappPage.stats.responseRate') }}
      p.text-2xl.font-black.mt-1(style="color: #7c3aed;") {{ analytics.responseRate || 0 }}%

  //- ─── Tab Navigation ──────────────────────────────────────────────────
  el-tabs(v-model="activeTab" @tab-click="onTabChange")
    //- ═══════════════════════════════════════════════════════════════════
    //- CONVERSATIONS TAB
    //- ═══════════════════════════════════════════════════════════════════
    el-tab-pane(:label="$t('whatsappPage.tabs.conversations')" name="conversations")
      .flex.gap-4(style="min-height: 520px;")
        //- Contact sidebar
        .w-80.flex-shrink-0.border.rounded-2xl.overflow-hidden(style="border-color: var(--border-default); background: var(--bg-elevated);")
          .p-3.border-b(style="border-color: var(--border-default);")
            el-input(
              v-model="contactSearch"
              :placeholder="$t('whatsappPage.common.search')"
              prefix-icon="Search"
              clearable
              size="default"
              @input="debouncedLoadContacts"
            )
          .overflow-y-auto(style="max-height: 470px;")
            .p-3.cursor-pointer.border-b.transition-all(
              v-for="c in contacts"
              :key="c.id"
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
            //- Empty state for contacts sidebar
            .p-8.text-center(v-if="!contacts.length && !contactsLoading")
              Icon(name="ph:whatsapp-logo" size="48" style="color: #25D366; opacity: 0.3;")
              p.text-sm.mt-2(style="color: var(--text-muted);") {{ $t('whatsappPage.emptyState.noContacts') }}
              el-button.mt-3(size="small" type="primary" @click="showContactDialog = true" style="background: #25D366; border: none; border-radius: 12px;")
                | {{ $t('whatsappPage.emptyState.addFirst') }}

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
                el-button(size="small" text @click="exportSingleConversation")
                  Icon(name="ph:export" size="16")
                el-dropdown(trigger="click")
                  el-button(size="small" text)
                    Icon(name="ph:dots-three-vertical" size="16")
                  template(#dropdown)
                    el-dropdown-menu
                      el-dropdown-item(@click="openFileUploadDialog")
                        Icon(name="ph:paperclip" size="14" style="margin-inline-end: 4px;")
                        | {{ $t('whatsappPage.messages.attachFile') }}
                      el-dropdown-item(@click="openSendMediaDialog")
                        Icon(name="ph:image" size="14" style="margin-inline-end: 4px;")
                        | {{ $t('whatsappPage.messages.sendMedia') }}
                      el-dropdown-item(@click="openSendTemplateDialog")
                        Icon(name="ph:file-text" size="14" style="margin-inline-end: 4px;")
                        | {{ $t('whatsappPage.messages.sendTemplate') }}
                      el-dropdown-item(divided @click="editSelectedContact")
                        Icon(name="ph:pencil-simple" size="14" style="margin-inline-end: 4px;")
                        | {{ $t('whatsappPage.contacts.editContact') }}

            //- Messages area
            .flex-1.overflow-y-auto.p-4.space-y-3(ref="chatArea" style="background: var(--bg-default);")
              .text-center.py-8(v-if="messagesLoading")
                el-icon.is-loading(size="24")
                  Icon(name="ph:spinner" size="24")
              template(v-else)
                .text-center.py-8(v-if="!chatMessages.length")
                  Icon(name="ph:chat-circle-dots" size="48" style="color: var(--text-muted);")
                  p.text-sm.mt-2(style="color: var(--text-muted);") {{ $t('whatsappPage.messages.noMessages') }}
                .flex(
                  v-for="msg in chatMessages"
                  :key="msg.id"
                  :class="msg.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'"
                )
                  .max-w-xs.rounded-2xl.p-3.shadow-sm(
                    :class="msg.direction === 'OUTBOUND' ? 'rounded-br-sm' : 'rounded-bl-sm'"
                    :style="msg.direction === 'OUTBOUND' ? 'background: #dcf8c6;' : 'background: var(--bg-elevated); border: 1px solid var(--border-default);'"
                  )
                    //- Media preview
                    template(v-if="msg.type === 'IMAGE' && msg.mediaUrl")
                      img.rounded-lg.mb-2.max-w-full(:src="msg.mediaUrl" :alt="msg.mediaCaption || 'Image'" style="max-height: 200px; object-fit: cover;")
                    template(v-else-if="msg.type === 'DOCUMENT' && msg.mediaUrl")
                      .flex.items-center.gap-2.mb-2.p-2.rounded-lg(style="background: rgba(0,0,0,0.05);")
                        Icon(name="ph:file-text" size="20" style="color: #25D366;")
                        .min-w-0
                          p.text-xs.font-semibold.truncate {{ msg.fileName || $t('whatsappPage.messages.document') }}
                        a.text-xs(:href="msg.mediaUrl" target="_blank" style="color: #25D366;") {{ $t('whatsappPage.messages.download') }}
                    template(v-else-if="msg.type !== 'TEXT' && msg.type !== 'TEMPLATE' && msg.mediaUrl")
                      .flex.items-center.gap-1.mb-1
                        Icon(:name="getMediaIcon(msg.type)" size="14" style="color: var(--text-muted);")
                        span.text-xs.font-semibold(style="color: var(--text-muted);") {{ msg.type }}
                    //- Template badge
                    .mb-1(v-if="msg.type === 'TEMPLATE'")
                      el-tag(size="small" type="info" round) {{ msg.templateName || 'Template' }}
                    p.text-sm(style="color: var(--text-primary); word-break: break-word;") {{ msg.content }}
                    .flex.items-center.justify-end.gap-1.mt-1
                      span.text-xs(style="color: var(--text-muted);") {{ formatTime(msg.createdAt) }}
                      //- Delivery status indicators (WhatsApp style)
                      template(v-if="msg.direction === 'OUTBOUND'")
                        .flex.items-center(v-if="msg.status === 'READ'")
                          Icon(name="ph:checks" size="14" style="color: #53bdeb;")
                        .flex.items-center(v-else-if="msg.status === 'DELIVERED'")
                          Icon(name="ph:checks" size="14" style="color: #8696a0;")
                        .flex.items-center(v-else-if="msg.status === 'SENT'")
                          Icon(name="ph:check" size="14" style="color: #8696a0;")
                        .flex.items-center(v-else-if="msg.status === 'FAILED'")
                          Icon(name="ph:warning-circle" size="14" style="color: #e74c3c;")
                        .flex.items-center(v-else)
                          Icon(name="ph:clock" size="14" style="color: #8696a0;")

            //- Message input
            .p-4.border-t(style="border-color: var(--border-default);")
              .flex.gap-2
                el-button(text circle @click="openFileUploadDialog")
                  Icon(name="ph:paperclip" size="18" style="color: var(--text-muted);")
                el-input(
                  v-model="newMessage"
                  :placeholder="$t('whatsappPage.messages.typeMessage')"
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
                  | {{ $t('whatsappPage.messages.send') }}

          //- No contact selected — empty state
          .flex-1.flex.items-center.justify-center(v-else)
            .text-center
              Icon(name="ph:whatsapp-logo" size="64" style="color: #25D366; opacity: 0.3;")
              p.text-lg.font-bold.mt-3(style="color: var(--text-muted);") {{ $t('whatsappPage.emptyState.welcome') }}
              p.text-sm.mt-1(style="color: var(--text-muted);") {{ $t('whatsappPage.messages.selectContact') }}
              el-button.mt-4(type="primary" @click="showContactDialog = true" style="background: #25D366; border: none; border-radius: 12px;")
                Icon(name="ph:plus" size="16" style="margin-inline-end: 4px;")
                | {{ $t('whatsappPage.emptyState.startFirst') }}

    //- ═══════════════════════════════════════════════════════════════════
    //- CONTACTS TAB
    //- ═══════════════════════════════════════════════════════════════════
    el-tab-pane(:label="$t('whatsappPage.tabs.contacts')" name="contacts")
      .mb-4.flex.items-center.gap-3.flex-wrap
        el-input(
          v-model="contactSearch"
          :placeholder="$t('whatsappPage.common.search')"
          prefix-icon="Search"
          clearable
          style="max-width: 320px;"
          @input="debouncedLoadContacts"
        )
        el-select(v-model="contactStatusFilter" :placeholder="$t('whatsappPage.contacts.status')" clearable style="width: 150px;" @change="loadContacts")
          el-option(:label="$t('whatsappPage.contacts.active')" value="ACTIVE")
          el-option(:label="$t('whatsappPage.contacts.blocked')" value="BLOCKED")
          el-option(:label="$t('whatsappPage.contacts.archived')" value="ARCHIVED")
        .flex-1
        el-button(size="default" @click="exportContactsCsv" :loading="exportingContacts")
          Icon(name="ph:file-csv" size="16" style="margin-inline-end: 4px;")
          | {{ $t('whatsappPage.exportContacts') }}
      el-card.rounded-2xl(shadow="never" style="border: 1px solid var(--border-default);" v-loading="contactsLoading")
        el-table(:data="contacts" style="width: 100%" :empty-text="$t('whatsappPage.contacts.noContacts')" @selection-change="onContactSelectionChange")
          el-table-column(type="selection" width="45")
          el-table-column(:label="$t('whatsappPage.contacts.name')" min-width="180")
            template(#default="{ row }")
              .flex.items-center.gap-2
                .w-8.h-8.rounded-full.flex.items-center.justify-center.text-white.font-bold.text-xs(style="background: #25D366;") {{ (row.name || row.phoneNumber || '?')[0].toUpperCase() }}
                div
                  p.text-sm.font-semibold {{ row.name || '-' }}
                  p.text-xs(style="color: var(--text-muted);") {{ row.client?.clientName || '' }}
          el-table-column(:label="$t('whatsappPage.contacts.phone')" min-width="160")
            template(#default="{ row }")
              span.text-sm.font-mono {{ row.phoneNumber }}
          el-table-column(:label="$t('whatsappPage.contacts.status')" width="120")
            template(#default="{ row }")
              el-tag(
                :type="row.status === 'ACTIVE' ? 'success' : row.status === 'BLOCKED' ? 'danger' : 'info'"
                size="small"
                round
              ) {{ row.status }}
          el-table-column(:label="$t('whatsappPage.contacts.tags')" min-width="180")
            template(#default="{ row }")
              el-tag(v-for="tag in (row.tags || [])" :key="tag" size="small" style="margin: 2px;" round) {{ tag }}
              span.text-gray-400(v-if="!row.tags?.length") -
          el-table-column(:label="$t('whatsappPage.contacts.unread')" width="90" align="center")
            template(#default="{ row }")
              el-badge(v-if="row.unreadCount > 0" :value="row.unreadCount" type="danger")
              span(v-else) 0
          el-table-column(:label="$t('whatsappPage.contacts.actions')" width="140" align="center")
            template(#default="{ row }")
              .flex.gap-1.justify-center
                el-button(size="small" text type="primary" @click="openChat(row)")
                  Icon(name="ph:chat-circle" size="16")
                el-button(size="small" text type="warning" @click="editContact(row)")
                  Icon(name="ph:pencil-simple" size="16")
                el-popconfirm(
                  :title="$t('whatsappPage.contacts.deleteConfirm')"
                  @confirm="deleteContact(row.id)"
                )
                  template(#reference)
                    el-button(size="small" text type="danger")
                      Icon(name="ph:trash" size="16")

        //- Bulk actions bar
        .flex.items-center.gap-3.mt-3(v-if="selectedContacts.length > 0")
          span.text-sm.font-semibold(style="color: var(--text-primary);") {{ selectedContacts.length }} {{ $t('whatsappPage.selected') }}
          el-button(size="small" type="danger" @click="bulkDeleteContacts")
            Icon(name="ph:trash" size="14" style="margin-inline-end: 4px;")
            | {{ $t('common.delete') }}
          el-button(size="small" type="primary" @click="openBulkSendFromSelection" style="background: #25D366; border: none;")
            Icon(name="ph:paper-plane-tilt" size="14" style="margin-inline-end: 4px;")
            | {{ $t('whatsappPage.messages.bulkSend') }}

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
    el-tab-pane(:label="$t('whatsappPage.tabs.templates')" name="templates")
      .mb-4.flex.items-center.justify-between
        .flex.gap-3
          el-input(
            v-model="templateSearch"
            :placeholder="$t('whatsappPage.common.search')"
            prefix-icon="Search"
            clearable
            style="max-width: 280px;"
            @input="debouncedLoadTemplates"
          )
          el-select(v-model="templateCategoryFilter" :placeholder="$t('whatsappPage.templates.category')" clearable style="width: 160px;" @change="loadTemplates")
            el-option(:label="$t('whatsappPage.templates.marketing')" value="MARKETING")
            el-option(:label="$t('whatsappPage.templates.utility')" value="UTILITY")
            el-option(:label="$t('whatsappPage.templates.authentication')" value="AUTHENTICATION")
        el-button(type="primary" @click="openTemplateDialog()" style="background: #25D366; border: none; border-radius: 12px;")
          Icon(name="ph:plus" size="16" style="margin-inline-end: 4px;")
          | {{ $t('whatsappPage.templates.addTemplate') }}

      el-card.rounded-2xl(shadow="never" style="border: 1px solid var(--border-default);" v-loading="templatesLoading")
        el-table(:data="templates" style="width: 100%" :empty-text="$t('whatsappPage.templates.noTemplates')")
          el-table-column(:label="$t('whatsappPage.templates.name')" min-width="180")
            template(#default="{ row }")
              p.text-sm.font-bold {{ row.name }}
          el-table-column(:label="$t('whatsappPage.templates.category')" width="140")
            template(#default="{ row }")
              el-tag(
                :type="row.category === 'MARKETING' ? 'warning' : row.category === 'AUTHENTICATION' ? 'danger' : 'info'"
                size="small"
                round
              ) {{ row.category }}
          el-table-column(:label="$t('whatsappPage.templates.language')" width="100")
            template(#default="{ row }")
              span.text-sm {{ row.language || 'en' }}
          el-table-column(:label="$t('whatsappPage.templates.content')" min-width="300")
            template(#default="{ row }")
              p.text-sm.line-clamp-2(style="color: var(--text-muted);") {{ row.content }}
          el-table-column(:label="$t('whatsappPage.templates.status')" width="120")
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
                  :title="$t('whatsappPage.templates.deleteConfirm')"
                  @confirm="deleteTemplate(row.id)"
                )
                  template(#reference)
                    el-button(size="small" text type="danger")
                      Icon(name="ph:trash" size="16")

    //- ═══════════════════════════════════════════════════════════════════
    //- ANALYTICS TAB
    //- ═══════════════════════════════════════════════════════════════════
    el-tab-pane(:label="$t('whatsappPage.tabs.analytics')" name="analytics")
      .grid.grid-cols-2.gap-4(class="md:grid-cols-4 lg:grid-cols-5")
        .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
          p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('whatsappPage.stats.totalSent') }}
          p.text-3xl.font-black.mt-1(style="color: #25D366;") {{ analytics.totalSent || 0 }}
        .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
          p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('whatsappPage.stats.totalReceived') }}
          p.text-3xl.font-black.mt-1(style="color: var(--text-primary);") {{ analytics.totalReceived || 0 }}
        .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
          p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('whatsappPage.stats.totalFailed') }}
          p.text-3xl.font-black.mt-1(style="color: #e74c3c;") {{ analytics.totalFailed || 0 }}
        .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
          p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('whatsappPage.stats.templateMessages') }}
          p.text-3xl.font-black.mt-1(style="color: #7c3aed;") {{ analytics.templateMessages || 0 }}
        .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
          p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('whatsappPage.stats.messagesThisWeek') }}
          p.text-3xl.font-black.mt-1(style="color: #f59e0b;") {{ analytics.messagesThisWeek || 0 }}
        .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
          p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('whatsappPage.stats.activeContacts') }}
          p.text-3xl.font-black.mt-1(style="color: #25D366;") {{ analytics.activeContacts || 0 }}
        .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
          p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('whatsappPage.stats.responseRate') }}
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
    el-form(label-position="top" size="large" ref="contactFormRef")
      .grid.grid-cols-1.gap-4(class="md:grid-cols-2")
        el-form-item(:label="$t('whatsappPage.contacts.phone')" required)
          el-input(v-model="contactForm.phoneNumber" placeholder="+966501234567" :disabled="!!editingContact")
        el-form-item(:label="$t('whatsappPage.contacts.name')")
          el-input(v-model="contactForm.name")
      el-form-item(:label="$t('whatsappPage.contacts.status')" v-if="editingContact")
        el-select(v-model="contactForm.status" style="width: 100%;")
          el-option(:label="$t('whatsappPage.contacts.active')" value="ACTIVE")
          el-option(:label="$t('whatsappPage.contacts.blocked')" value="BLOCKED")
          el-option(:label="$t('whatsappPage.contacts.archived')" value="ARCHIVED")
      el-form-item(:label="$t('whatsappPage.contacts.tags')")
        el-select(v-model="contactForm.tags" multiple filterable allow-create default-first-option style="width: 100%;" :placeholder="$t('whatsappPage.contacts.addTags')")
    template(#footer)
      el-button(@click="showContactDialog = false") {{ $t('whatsappPage.common.cancel') }}
      el-button(type="primary" :loading="savingContact" @click="saveContact" style="background: #25D366; border: none; border-radius: 12px;") {{ $t('whatsappPage.common.save') }}

  //- Template Dialog
  el-dialog(
    v-model="showTemplateDialog"
    :title="templateDialogTitle"
    width="600px"
  )
    el-form(label-position="top" size="large")
      .grid.grid-cols-1.gap-4(class="md:grid-cols-2")
        el-form-item(:label="$t('whatsappPage.templates.name')" required)
          el-input(v-model="templateForm.name")
        el-form-item(:label="$t('whatsappPage.templates.language')")
          el-select(v-model="templateForm.language" style="width: 100%;")
            el-option(:label="$t('whatsapp.english')" value="en")
            el-option(:label="$t('whatsapp.arabic')" value="ar")
      el-form-item(:label="$t('whatsappPage.templates.category')")
        el-select(v-model="templateForm.category" style="width: 100%;")
          el-option(:label="$t('whatsappPage.templates.marketing')" value="MARKETING")
          el-option(:label="$t('whatsappPage.templates.utility')" value="UTILITY")
          el-option(:label="$t('whatsappPage.templates.authentication')" value="AUTHENTICATION")
      el-form-item(:label="$t('whatsappPage.templates.content')" required)
        el-input(v-model="templateForm.content" type="textarea" :rows="5" :placeholder="templatePlaceholderExample")
        p.text-xs.mt-1(style="color: var(--text-muted);") {{ placeholderHelpText }}
      .grid.grid-cols-1.gap-4(class="md:grid-cols-2")
        el-form-item(:label="$t('whatsappPage.templates.headerType')")
          el-select(v-model="templateForm.headerType" style="width: 100%;")
            el-option(:label="$t('whatsapp.none')" value="NONE")
            el-option(:label="$t('whatsapp.text')" value="TEXT")
            el-option(:label="$t('whatsapp.image')" value="IMAGE")
            el-option(:label="$t('whatsapp.document')" value="DOCUMENT")
        el-form-item(:label="$t('whatsappPage.templates.headerContent')" v-if="templateForm.headerType !== 'NONE'")
          el-input(v-model="templateForm.headerContent")
      el-form-item(:label="$t('whatsappPage.templates.footerText')")
        el-input(v-model="templateForm.footerText")
    template(#footer)
      el-button(@click="showTemplateDialog = false") {{ $t('whatsappPage.common.cancel') }}
      el-button(type="primary" :loading="savingTemplate" @click="saveTemplate" style="background: #25D366; border: none; border-radius: 12px;") {{ $t('whatsappPage.common.save') }}

  //- Send Media Dialog (URL or file upload)
  el-dialog(
    v-model="showMediaDialog"
    :title="$t('whatsappPage.messages.sendMedia')"
    width="500px"
  )
    el-form(label-position="top" size="large")
      el-form-item(:label="$t('whatsappPage.messages.mediaType')")
        el-select(v-model="mediaForm.type" style="width: 100%;")
          el-option(:label="$t('whatsapp.image')" value="IMAGE")
          el-option(:label="$t('whatsapp.document')" value="DOCUMENT")
          el-option(:label="$t('whatsapp.audio')" value="AUDIO")
          el-option(:label="$t('whatsapp.video')" value="VIDEO")
      el-form-item(:label="$t('whatsappPage.messages.uploadFile')")
        el-upload(
          ref="mediaUploadRef"
          :auto-upload="false"
          :limit="1"
          :on-change="handleMediaFileChange"
          :on-remove="handleMediaFileRemove"
          :accept="mediaAcceptTypes"
          drag
        )
          .py-4.text-center
            Icon(name="ph:cloud-arrow-up" size="32" style="color: var(--text-muted);")
            p.text-sm.mt-2(style="color: var(--text-muted);") {{ $t('whatsappPage.messages.dragOrClick') }}
      el-form-item(:label="$t('whatsappPage.messages.mediaUrl')" v-if="!mediaFile")
        el-input(v-model="mediaForm.mediaUrl" placeholder="https://...")
      el-form-item(:label="$t('whatsappPage.messages.mediaCaption')")
        el-input(v-model="mediaForm.mediaCaption" type="textarea" :rows="2")
      el-form-item(:label="$t('whatsappPage.messages.fileName')" v-if="mediaForm.type === 'DOCUMENT'")
        el-input(v-model="mediaForm.fileName" placeholder="invoice.pdf")
    template(#footer)
      el-button(@click="showMediaDialog = false") {{ $t('whatsappPage.common.cancel') }}
      el-button(type="primary" :loading="sendingMessage" @click="sendMediaMessage" :disabled="!mediaForm.mediaUrl && !mediaFile" style="background: #25D366; border: none; border-radius: 12px;") {{ $t('whatsappPage.messages.send') }}

  //- Send Template Dialog
  el-dialog(
    v-model="showSendTemplateDialog"
    :title="$t('whatsappPage.messages.sendTemplate')"
    width="500px"
  )
    el-form(label-position="top" size="large")
      el-form-item(:label="$t('whatsappPage.messages.chooseTemplate')" required)
        el-select(v-model="sendTemplateForm.templateId" style="width: 100%;" filterable)
          el-option(v-for="tpl in templates" :key="tpl.id" :label="tpl.name" :value="tpl.id")
            span {{ tpl.name }}
            span.text-xs.ms-2(style="color: var(--text-muted);") ({{ tpl.category }})
      //- Template preview with variable substitution
      .rounded-xl.p-3.mb-3(v-if="selectedTemplate" style="background: var(--bg-default); border: 1px solid var(--border-default);")
        p.text-xs.font-bold.mb-1(style="color: var(--text-muted);") {{ $t('whatsappPage.messages.preview') }}
        p.text-sm {{ substituteTemplateVars(selectedTemplate.content) }}
      el-form-item(:label="$t('whatsappPage.messages.templateVars')" v-if="templateVarKeys.length")
        .grid.grid-cols-2.gap-2
          .flex.flex-col.gap-1(v-for="key in templateVarKeys" :key="key")
            label.text-xs.font-semibold(style="color: var(--text-muted);") {{ '{' + key + '}' }}
            el-input(
              v-model="sendTemplateForm.variables[key]"
              :placeholder="$t('whatsappPage.messages.valueFor') + ' {' + key + '}'"
              size="default"
            )
    template(#footer)
      el-button(@click="showSendTemplateDialog = false") {{ $t('whatsappPage.common.cancel') }}
      el-button(type="primary" :loading="sendingMessage" @click="sendTemplateMessage" style="background: #25D366; border: none; border-radius: 12px;") {{ $t('whatsappPage.messages.send') }}

  //- Bulk Send Dialog
  el-dialog(
    v-model="showBulkSendDialog"
    :title="$t('whatsappPage.messages.bulkSend')"
    width="600px"
  )
    el-form(label-position="top" size="large")
      el-form-item(:label="$t('whatsappPage.messages.selectContacts')" required)
        el-select(
          v-model="bulkSendForm.contactIds"
          multiple
          filterable
          style="width: 100%;"
          :placeholder="$t('whatsappPage.messages.selectContacts')"
        )
          el-option(v-for="c in contacts" :key="c.id" :label="c.name || c.phoneNumber" :value="c.id")
      el-form-item(:label="$t('whatsappPage.messages.chooseTemplate')" required)
        el-select(v-model="bulkSendForm.templateId" style="width: 100%;" filterable)
          el-option(v-for="tpl in templates.filter(t => t.status === 'APPROVED')" :key="tpl.id" :label="tpl.name" :value="tpl.id")
      .rounded-xl.p-3.mb-3(v-if="bulkSelectedTemplate" style="background: var(--bg-default); border: 1px solid var(--border-default);")
        p.text-sm {{ bulkSelectedTemplate.content }}
      el-form-item(:label="$t('whatsappPage.messages.templateVars')" v-if="bulkTemplateVarKeys.length")
        .grid.grid-cols-2.gap-2
          el-input(
            v-for="key in bulkTemplateVarKeys"
            :key="key"
            v-model="bulkSendForm.variables[key]"
            :placeholder="$t('whatsappPage.messages.valueFor') + ' {' + key + '}'"
            size="default"
          )
    template(#footer)
      el-button(@click="showBulkSendDialog = false") {{ $t('whatsappPage.common.cancel') }}
      el-button(
        type="primary"
        :loading="bulkSending"
        @click="executeBulkSend"
        :disabled="!bulkSendForm.contactIds.length || !bulkSendForm.templateId"
        style="background: #25D366; border: none; border-radius: 12px;"
      )
        Icon(name="ph:paper-plane-tilt" size="16" style="margin-inline-end: 4px;")
        | {{ $t('whatsappPage.messages.bulkSend') }} ({{ bulkSendForm.contactIds.length }})
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue';
import { useApiFetch } from '~/composables/useApiFetch';

const { $i18n } = useNuxtApp();
const _t = $i18n.t;
const templatePlaceholderExample = 'Hello {1}, your order {2} is ready.';
const placeholderHelpText = computed(() => _t('whatsappPage.templates.placeholderHelp'));

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
  metadata?: Record<string, unknown>;
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
  buttons: Record<string, unknown>[];
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
const selectedContacts = ref<WAContact[]>([]);

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

// Export
const exporting = ref(false);
const exportingContacts = ref(false);

// File upload
const mediaFile = ref<File | null>(null);
const mediaUploadRef = ref<Record<string, unknown> | null>(null);

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

const contactDialogTitle = computed(() => (editingContact.value ? _t('whatsappPage.contacts.editContact') : _t('whatsappPage.contacts.addContact')));

const showTemplateDialog = ref(false);
const editingTemplate = ref<WATemplate | null>(null);
const templateDialogTitle = computed(() =>
  editingTemplate.value ? _t('whatsappPage.templates.editTemplate') : _t('whatsappPage.templates.addTemplate')
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

const mediaAcceptTypes = computed(() => {
  switch (mediaForm.type) {
    case 'IMAGE':
      return 'image/*';
    case 'DOCUMENT':
      return '.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt';
    case 'AUDIO':
      return 'audio/*';
    case 'VIDEO':
      return 'video/*';
    default:
      return '*';
  }
});

const showSendTemplateDialog = ref(false);
const sendTemplateForm = reactive({
  templateId: '',
  variables: {} as Record<string, string>
});

// Bulk send
const showBulkSendDialog = ref(false);
const bulkSending = ref(false);
const bulkSendForm = reactive({
  contactIds: [] as string[],
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
  const matches = selectedTemplate.value.content.match(/\{(\w+)\}/g) || [];
  return [...new Set(matches.map(m => m.replace(/\{|\}/g, '')))];
});

const bulkSelectedTemplate = computed(() => {
  return templates.value.find(t => t.id === bulkSendForm.templateId) || null;
});

const bulkTemplateVarKeys = computed(() => {
  if (!bulkSelectedTemplate.value) return [];
  const matches = bulkSelectedTemplate.value.content.match(/\{(\w+)\}/g) || [];
  return [...new Set(matches.map(m => m.replace(/\{|\}/g, '')))];
});

function substituteTemplateVars(content: string): string {
  let result = content;
  for (const [key, value] of Object.entries(sendTemplateForm.variables)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value || `{${key}}`);
  }
  return result;
}

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
      const data = body as unknown;
      contacts.value = data.docs || [];
      if (data.pagination) {
        contactsPagination.value = data.pagination;
      }
    }
  } catch (err) {
    ElMessage.error(_t('whatsappPage.errors.loadContacts'));
  } finally {
    contactsLoading.value = false;
  }
}

async function loadMessages(contactId: string) {
  messagesLoading.value = true;
  try {
    const { body, success } = await useApiFetch(`whatsapp/messages/${contactId}?limit=100`);
    if (success && body) {
      const data = body as unknown;
      chatMessages.value = data.docs || [];
      await nextTick();
      scrollToBottom();
    }
  } catch (err) {
    ElMessage.error(_t('whatsappPage.errors.loadMessages'));
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
      const data = body as unknown;
      templates.value = data.docs || [];
    }
  } catch (err) {
    ElMessage.error(_t('whatsappPage.errors.loadTemplates'));
  } finally {
    templatesLoading.value = false;
  }
}

async function loadAnalytics() {
  try {
    const { body, success } = await useApiFetch('whatsapp/analytics');
    if (success && body) {
      analytics.value = body as unknown;
    }
  } catch (err) {
    ElMessage.error(_t('whatsappPage.errors.loadAnalytics'));
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

function onContactSelectionChange(selection: WAContact[]) {
  selectedContacts.value = selection;
}

async function saveContact() {
  if (!editingContact.value && !contactForm.phoneNumber.trim()) {
    ElMessage.warning(_t('whatsappPage.errors.phoneRequired'));
    return;
  }
  savingContact.value = true;
  try {
    if (editingContact.value) {
      const { success } = await useApiFetch(`whatsapp/contacts/${editingContact.value.id}`, 'PUT', {
        name: contactForm.name,
        status: contactForm.status,
        tags: contactForm.tags
      });
      if (success) {
        ElMessage.success(_t('whatsappPage.success.contactUpdated'));
        showContactDialog.value = false;
        loadContacts();
      } else {
        ElMessage.error(_t('whatsappPage.errors.saveContact'));
      }
    } else {
      const { success } = await useApiFetch('whatsapp/contacts', 'POST', {
        phoneNumber: contactForm.phoneNumber,
        name: contactForm.name,
        tags: contactForm.tags
      });
      if (success) {
        ElMessage.success(_t('whatsappPage.success.contactCreated'));
        showContactDialog.value = false;
        loadContacts();
      } else {
        ElMessage.error(_t('whatsappPage.errors.saveContact'));
      }
    }
  } catch (err) {
    ElMessage.error(_t('whatsappPage.errors.saveContact'));
  } finally {
    savingContact.value = false;
  }
}

async function deleteContact(id: string) {
  try {
    const { success } = await useApiFetch(`whatsapp/contacts/${id}`, 'DELETE');
    if (success) {
      ElMessage.success(_t('whatsappPage.success.contactDeleted'));
      if (selectedContact.value?.id === id) {
        selectedContact.value = null;
        chatMessages.value = [];
      }
      loadContacts();
    } else {
      ElMessage.error(_t('whatsappPage.errors.deleteContact'));
    }
  } catch (err) {
    ElMessage.error(_t('whatsappPage.errors.deleteContact'));
  }
}

async function bulkDeleteContacts() {
  if (!selectedContacts.value.length) return;
  try {
    await ElMessageBox.confirm(_t('whatsappPage.contacts.bulkDeleteConfirm'), _t('common.warning'), { type: 'warning' });
    for (const c of selectedContacts.value) {
      await useApiFetch(`whatsapp/contacts/${c.id}`, 'DELETE');
    }
    ElMessage.success(_t('whatsappPage.success.bulkDeleted'));
    selectedContacts.value = [];
    loadContacts();
  } catch {
    // cancelled
  }
}

async function importContacts() {
  importing.value = true;
  try {
    const { body, success } = await useApiFetch('whatsapp/contacts/import', 'POST');
    if (success && body) {
      const data = body as unknown;
      ElMessage.success(_t('whatsappPage.contacts.importSuccess') + `: ${data.imported || 0}`);
      loadContacts();
    } else {
      ElMessage.error(_t('whatsappPage.errors.importFailed'));
    }
  } catch (err) {
    ElMessage.error(_t('whatsappPage.errors.importFailed'));
  } finally {
    importing.value = false;
  }
}

function handleContactPageChange(page: number) {
  loadContacts(page);
}

// ─── Message Actions ────────────────────────────────────────────────────────

async function sendTextMessage() {
  if (!newMessage.value.trim()) {
    ElMessage.warning(_t('whatsappPage.errors.emptyMessage'));
    return;
  }
  if (!selectedContact.value) {
    ElMessage.warning(_t('whatsappPage.errors.noContact'));
    return;
  }
  sendingMessage.value = true;
  try {
    const { body, success } = await useApiFetch('whatsapp/messages/send/text', 'POST', {
      contactId: selectedContact.value.id,
      content: newMessage.value
    });
    if (success && body) {
      chatMessages.value.push(body as unknown);
      newMessage.value = '';
      await nextTick();
      scrollToBottom();
    } else {
      ElMessage.error(_t('whatsappPage.errors.sendFailed'));
    }
  } catch (err) {
    ElMessage.error(_t('whatsappPage.errors.sendFailed'));
  } finally {
    sendingMessage.value = false;
  }
}

function openSendMediaDialog() {
  Object.assign(mediaForm, { type: 'DOCUMENT', mediaUrl: '', mediaCaption: '', fileName: '' });
  mediaFile.value = null;
  showMediaDialog.value = true;
}

function openFileUploadDialog() {
  Object.assign(mediaForm, { type: 'IMAGE', mediaUrl: '', mediaCaption: '', fileName: '' });
  mediaFile.value = null;
  showMediaDialog.value = true;
}

function handleMediaFileChange(file: unknown) {
  mediaFile.value = file.raw;
  // Auto-detect type
  const mime = file.raw.type || '';
  if (mime.startsWith('image/')) mediaForm.type = 'IMAGE';
  else if (mime.startsWith('video/')) mediaForm.type = 'VIDEO';
  else if (mime.startsWith('audio/')) mediaForm.type = 'AUDIO';
  else mediaForm.type = 'DOCUMENT';
  mediaForm.fileName = file.name;
}

function handleMediaFileRemove() {
  mediaFile.value = null;
}

async function sendMediaMessage() {
  if (!selectedContact.value) {
    ElMessage.warning(_t('whatsappPage.errors.noContact'));
    return;
  }
  if (!mediaForm.mediaUrl.trim() && !mediaFile.value) {
    ElMessage.warning(_t('whatsappPage.errors.noMedia'));
    return;
  }

  sendingMessage.value = true;
  try {
    let uploadedUrl = mediaForm.mediaUrl;

    // Upload file if provided
    if (mediaFile.value) {
      const formData = new FormData();
      formData.append('file', mediaFile.value);
      formData.append('type', mediaForm.type);
      const uploadRes = await useApiFetch('whatsapp/upload', 'POST', formData);
      if (uploadRes.success && uploadRes.body) {
        uploadedUrl = (uploadRes.body as unknown).url || '';
      } else {
        ElMessage.error(_t('whatsappPage.errors.uploadFailed'));
        return;
      }
    }

    const { body, success } = await useApiFetch('whatsapp/messages/send/media', 'POST', {
      contactId: selectedContact.value.id,
      content: mediaForm.mediaCaption || '',
      type: mediaForm.type,
      mediaUrl: uploadedUrl,
      mediaCaption: mediaForm.mediaCaption,
      fileName: mediaForm.fileName
    });
    if (success && body) {
      chatMessages.value.push(body as unknown);
      showMediaDialog.value = false;
      mediaFile.value = null;
      await nextTick();
      scrollToBottom();
    } else {
      ElMessage.error(_t('whatsappPage.errors.sendFailed'));
    }
  } catch (err) {
    ElMessage.error(_t('whatsappPage.errors.sendFailed'));
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
  if (!sendTemplateForm.templateId) {
    ElMessage.warning(_t('whatsappPage.errors.noTemplate'));
    return;
  }
  if (!selectedContact.value) {
    ElMessage.warning(_t('whatsappPage.errors.noContact'));
    return;
  }
  sendingMessage.value = true;
  try {
    const { body, success } = await useApiFetch('whatsapp/messages/send/template', 'POST', {
      contactId: selectedContact.value.id,
      templateId: sendTemplateForm.templateId,
      variables: sendTemplateForm.variables
    });
    if (success && body) {
      chatMessages.value.push(body as unknown);
      showSendTemplateDialog.value = false;
      await nextTick();
      scrollToBottom();
    } else {
      ElMessage.error(_t('whatsappPage.errors.sendFailed'));
    }
  } catch (err) {
    ElMessage.error(_t('whatsappPage.errors.sendFailed'));
  } finally {
    sendingMessage.value = false;
  }
}

async function markConversationRead() {
  if (!selectedContact.value) return;
  try {
    await useApiFetch(`whatsapp/messages/read/${selectedContact.value.id}`, 'PUT');
    if (selectedContact.value) {
      selectedContact.value.unreadCount = 0;
    }
  } catch (err) {
    ElMessage.error(_t('whatsappPage.errors.markReadFailed'));
  }
}

// ─── Bulk Send ──────────────────────────────────────────────────────────────

function openBulkSendFromSelection() {
  bulkSendForm.contactIds = selectedContacts.value.map(c => c.id);
  bulkSendForm.templateId = '';
  bulkSendForm.variables = {};
  if (!templates.value.length) loadTemplates();
  showBulkSendDialog.value = true;
}

async function executeBulkSend() {
  if (!bulkSendForm.contactIds.length) {
    ElMessage.warning(_t('whatsappPage.errors.noContactsSelected'));
    return;
  }
  if (!bulkSendForm.templateId) {
    ElMessage.warning(_t('whatsappPage.errors.noTemplate'));
    return;
  }
  bulkSending.value = true;
  try {
    const { body, success } = await useApiFetch('whatsapp/messages/send/bulk', 'POST', {
      contactIds: bulkSendForm.contactIds,
      templateId: bulkSendForm.templateId,
      variables: bulkSendForm.variables
    });
    if (success && body) {
      const data = body as unknown;
      ElMessage.success(
        `${_t('whatsappPage.messages.bulkResult')
          .replace('{sent}', data.sent || 0)
          .replace('{failed}', data.failed || 0)}`
      );
      showBulkSendDialog.value = false;
    } else {
      ElMessage.error(_t('whatsappPage.errors.bulkSendFailed'));
    }
  } catch (err) {
    ElMessage.error(_t('whatsappPage.errors.bulkSendFailed'));
  } finally {
    bulkSending.value = false;
  }
}

// ─── Export ─────────────────────────────────────────────────────────────────

async function exportConversations() {
  exporting.value = true;
  try {
    const { body, success } = await useApiFetch('whatsapp/export/conversations');
    if (success && body) {
      const data = body as unknown;
      downloadCsv(data.csv || data, 'whatsapp-conversations.csv');
      ElMessage.success(_t('whatsappPage.success.exported'));
    } else {
      ElMessage.error(_t('whatsappPage.errors.exportFailed'));
    }
  } catch (err) {
    ElMessage.error(_t('whatsappPage.errors.exportFailed'));
  } finally {
    exporting.value = false;
  }
}

async function exportSingleConversation() {
  if (!selectedContact.value) return;
  try {
    const { body, success } = await useApiFetch(`whatsapp/export/messages/${selectedContact.value.id}`);
    if (success && body) {
      const data = body as unknown;
      downloadCsv(data.csv || data, `chat-${selectedContact.value.name || selectedContact.value.phoneNumber}.csv`);
      ElMessage.success(_t('whatsappPage.success.exported'));
    } else {
      ElMessage.error(_t('whatsappPage.errors.exportFailed'));
    }
  } catch (err) {
    ElMessage.error(_t('whatsappPage.errors.exportFailed'));
  }
}

async function exportContactsCsv() {
  exportingContacts.value = true;
  try {
    const { body, success } = await useApiFetch('whatsapp/export/contacts');
    if (success && body) {
      const data = body as unknown;
      downloadCsv(data.csv || data, 'whatsapp-contacts.csv');
      ElMessage.success(_t('whatsappPage.success.exported'));
    } else {
      ElMessage.error(_t('whatsappPage.errors.exportFailed'));
    }
  } catch (err) {
    ElMessage.error(_t('whatsappPage.errors.exportFailed'));
  } finally {
    exportingContacts.value = false;
  }
}

function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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
  if (!templateForm.name.trim()) {
    ElMessage.warning(_t('whatsappPage.errors.templateNameRequired'));
    return;
  }
  if (!templateForm.content.trim()) {
    ElMessage.warning(_t('whatsappPage.errors.templateContentRequired'));
    return;
  }
  savingTemplate.value = true;
  try {
    const payload = { ...templateForm };
    if (editingTemplate.value) {
      const { success } = await useApiFetch(`whatsapp/templates/${editingTemplate.value.id}`, 'PUT', payload);
      if (success) {
        ElMessage.success(_t('whatsappPage.success.templateUpdated'));
        showTemplateDialog.value = false;
        loadTemplates();
      } else {
        ElMessage.error(_t('whatsappPage.errors.saveTemplate'));
      }
    } else {
      const { success } = await useApiFetch('whatsapp/templates', 'POST', payload);
      if (success) {
        ElMessage.success(_t('whatsappPage.success.templateCreated'));
        showTemplateDialog.value = false;
        loadTemplates();
      } else {
        ElMessage.error(_t('whatsappPage.errors.saveTemplate'));
      }
    }
  } catch (err) {
    ElMessage.error(_t('whatsappPage.errors.saveTemplate'));
  } finally {
    savingTemplate.value = false;
  }
}

async function deleteTemplate(id: string) {
  try {
    const { success } = await useApiFetch(`whatsapp/templates/${id}`, 'DELETE');
    if (success) {
      ElMessage.success(_t('whatsappPage.success.templateDeleted'));
      loadTemplates();
    } else {
      ElMessage.error(_t('whatsappPage.errors.deleteTemplate'));
    }
  } catch (err) {
    ElMessage.error(_t('whatsappPage.errors.deleteTemplate'));
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

function getMediaIcon(type: string): string {
  switch (type) {
    case 'IMAGE':
      return 'ph:image';
    case 'DOCUMENT':
      return 'ph:file-text';
    case 'AUDIO':
      return 'ph:microphone';
    case 'VIDEO':
      return 'ph:video-camera';
    case 'LOCATION':
      return 'ph:map-pin';
    default:
      return 'ph:file';
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

watch(showContactDialog, val => {
  if (!val) {
    editingContact.value = null;
    Object.assign(contactForm, { phoneNumber: '', name: '', status: 'ACTIVE', tags: [] });
  }
});

watch(
  () => sendTemplateForm.templateId,
  () => {
    sendTemplateForm.variables = {};
  }
);

watch(
  () => bulkSendForm.templateId,
  () => {
    bulkSendForm.variables = {};
  }
);

// ─── Init ───────────────────────────────────────────────────────────────────

onMounted(() => {
  loadContacts();
  loadAnalytics();
});
</script>
