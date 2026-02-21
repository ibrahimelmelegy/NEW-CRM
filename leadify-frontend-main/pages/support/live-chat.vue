<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="glass-panel p-6 rounded-2xl">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
            Live Chat
          </h1>
          <p class="text-slate-400 text-sm mt-1">Manage real-time customer conversations, assign agents, and resolve queries.</p>
        </div>
        <div class="flex gap-2">
          <el-select v-model="filterStatus" class="w-36" placeholder="Filter">
            <el-option label="All Chats" value="" />
            <el-option label="Active" value="active" />
            <el-option label="Waiting" value="waiting" />
            <el-option label="Resolved" value="resolved" />
          </el-select>
          <el-button type="primary" class="!rounded-xl" @click="toggleAvailability">
            <Icon :name="isAvailable ? 'ph:circle-fill' : 'ph:circle'" class="w-4 h-4 mr-2" :class="isAvailable ? 'text-emerald-300' : 'text-red-300'" />
            {{ isAvailable ? 'Online' : 'Offline' }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-blue-400">{{ activeChatsCount }}</div>
        <div class="text-xs text-slate-500 mt-1">Active Chats</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-cyan-400">1.2m</div>
        <div class="text-xs text-slate-500 mt-1">Avg Response Time</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-emerald-400">4.8</div>
        <div class="text-xs text-slate-500 mt-1">Satisfaction</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-amber-400">{{ resolvedTodayCount }}</div>
        <div class="text-xs text-slate-500 mt-1">Resolved Today</div>
      </div>
    </div>

    <!-- Chat Interface -->
    <div class="grid grid-cols-12 gap-4" style="height: calc(100vh - 380px); min-height: 500px;">
      <!-- Left Panel: Chat List -->
      <div class="col-span-3 glass-panel rounded-xl flex flex-col overflow-hidden">
        <div class="p-3 border-b border-slate-800/60">
          <el-input v-model="chatSearch" placeholder="Search conversations..." size="small" clearable>
            <template #prefix>
              <Icon name="ph:magnifying-glass" class="w-4 h-4" />
            </template>
          </el-input>
        </div>
        <div class="flex-1 overflow-y-auto">
          <div v-for="chat in filteredChats" :key="chat.id"
            class="flex items-start gap-3 p-3 cursor-pointer hover:bg-slate-800/30 transition border-b border-slate-800/30"
            :class="selectedChatId === chat.id ? 'bg-slate-800/50 border-l-2 border-l-blue-400' : ''"
            @click="selectChat(chat.id)"
          >
            <div class="relative flex-shrink-0">
              <el-avatar :size="36" class="bg-slate-700">{{ chat.visitorName.charAt(0) }}</el-avatar>
              <div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900"
                :class="chat.status === 'active' ? 'bg-emerald-400' : chat.status === 'waiting' ? 'bg-amber-400' : 'bg-slate-500'"></div>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex justify-between items-center">
                <span class="text-sm font-medium text-slate-200 truncate">{{ chat.visitorName }}</span>
                <span class="text-[10px] text-slate-500 flex-shrink-0">{{ chat.lastMessageTime }}</span>
              </div>
              <p class="text-xs text-slate-400 truncate mt-0.5">{{ chat.lastMessage }}</p>
              <div class="flex items-center gap-1 mt-1">
                <el-tag :type="getChatStatusType(chat.status)" effect="dark" size="small" class="!text-[10px] !px-1.5 !py-0">
                  {{ chat.status }}
                </el-tag>
                <span v-if="chat.unreadCount > 0" class="ml-auto w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {{ chat.unreadCount }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Center: Conversation Area -->
      <div class="col-span-6 glass-panel rounded-xl flex flex-col overflow-hidden">
        <template v-if="activeChat">
          <!-- Chat Header -->
          <div class="p-4 border-b border-slate-800/60 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <el-avatar :size="36" class="bg-slate-700">{{ activeChat.visitorName.charAt(0) }}</el-avatar>
              <div>
                <div class="text-sm font-medium text-slate-200">{{ activeChat.visitorName }}</div>
                <div class="text-xs text-slate-500">{{ activeChat.visitorEmail }}</div>
              </div>
            </div>
            <div class="flex gap-1">
              <el-tooltip content="Transfer Chat">
                <el-button text size="small" @click="showTransferDialog = true">
                  <Icon name="ph:user-switch-bold" class="w-4 h-4" />
                </el-button>
              </el-tooltip>
              <el-tooltip content="Resolve">
                <el-button text size="small" type="success" @click="resolveChat">
                  <Icon name="ph:check-circle-bold" class="w-4 h-4" />
                </el-button>
              </el-tooltip>
              <el-tooltip content="End Chat">
                <el-button text size="small" type="danger" @click="endChat">
                  <Icon name="ph:x-circle-bold" class="w-4 h-4" />
                </el-button>
              </el-tooltip>
            </div>
          </div>

          <!-- Messages -->
          <div class="flex-1 overflow-y-auto p-4 space-y-4" ref="messagesContainer">
            <div v-for="msg in activeChat.messages" :key="msg.id"
              class="flex" :class="msg.sender === 'agent' ? 'justify-end' : 'justify-start'"
            >
              <div class="max-w-[75%] rounded-2xl px-4 py-2.5"
                :class="msg.sender === 'agent'
                  ? 'bg-blue-500/20 text-slate-200 rounded-br-sm'
                  : 'bg-slate-800/60 text-slate-300 rounded-bl-sm'"
              >
                <p class="text-sm">{{ msg.text }}</p>
                <div class="flex items-center justify-end gap-1 mt-1">
                  <span class="text-[10px] text-slate-500">{{ msg.time }}</span>
                  <Icon v-if="msg.sender === 'agent'" name="ph:checks-bold" class="w-3 h-3"
                    :class="msg.read ? 'text-blue-400' : 'text-slate-600'" />
                </div>
              </div>
            </div>

            <!-- Typing Indicator -->
            <div v-if="activeChat.isTyping" class="flex justify-start">
              <div class="bg-slate-800/60 rounded-2xl rounded-bl-sm px-4 py-3">
                <div class="flex gap-1">
                  <span class="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 0ms"></span>
                  <span class="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 150ms"></span>
                  <span class="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 300ms"></span>
                </div>
              </div>
            </div>
          </div>

          <!-- Message Input -->
          <div class="p-4 border-t border-slate-800/60">
            <div class="flex gap-2">
              <el-input v-model="messageText" placeholder="Type a message..." @keyup.enter="sendMessage" class="flex-1">
                <template #prefix>
                  <el-tooltip content="Attach file">
                    <Icon name="ph:paperclip-bold" class="w-4 h-4 cursor-pointer text-slate-400 hover:text-slate-200" />
                  </el-tooltip>
                </template>
              </el-input>
              <el-button type="primary" @click="sendMessage" :disabled="!messageText.trim()">
                <Icon name="ph:paper-plane-tilt-bold" class="w-4 h-4" />
              </el-button>
            </div>
          </div>
        </template>

        <div v-else class="flex-1 flex flex-col items-center justify-center">
          <Icon name="ph:chats-circle-bold" class="w-20 h-20 text-slate-600 mb-4" />
          <h3 class="text-lg font-medium text-slate-400">No Chat Selected</h3>
          <p class="text-sm text-slate-500 mt-1">Select a conversation from the list to start chatting</p>
        </div>
      </div>

      <!-- Right Panel: Visitor Info -->
      <div class="col-span-3 glass-panel rounded-xl flex flex-col overflow-hidden">
        <template v-if="activeChat">
          <div class="p-4 border-b border-slate-800/60">
            <h4 class="text-sm font-medium text-slate-300">Visitor Info</h4>
          </div>

          <div class="flex-1 overflow-y-auto p-4 space-y-4">
            <!-- Visitor Details -->
            <div class="space-y-3">
              <div class="flex items-center gap-2">
                <Icon name="ph:user-bold" class="w-4 h-4 text-slate-500" />
                <span class="text-sm text-slate-200">{{ activeChat.visitorName }}</span>
              </div>
              <div class="flex items-center gap-2">
                <Icon name="ph:envelope-bold" class="w-4 h-4 text-slate-500" />
                <span class="text-sm text-slate-200">{{ activeChat.visitorEmail }}</span>
              </div>
              <div class="flex items-center gap-2">
                <Icon name="ph:browser-bold" class="w-4 h-4 text-slate-500" />
                <span class="text-sm text-slate-400">{{ activeChat.visitorInfo.browser }}</span>
              </div>
              <div class="flex items-center gap-2">
                <Icon name="ph:globe-bold" class="w-4 h-4 text-slate-500" />
                <span class="text-sm text-slate-400">{{ activeChat.visitorInfo.location }}</span>
              </div>
              <div class="flex items-center gap-2">
                <Icon name="ph:link-bold" class="w-4 h-4 text-slate-500" />
                <span class="text-sm text-blue-400 truncate">{{ activeChat.visitorInfo.currentPage }}</span>
              </div>
            </div>

            <!-- Quick Replies -->
            <div class="pt-4 border-t border-slate-800/60">
              <h5 class="text-xs font-medium text-slate-400 mb-2">Quick Replies</h5>
              <div class="space-y-1.5">
                <div v-for="reply in quickReplies" :key="reply.id"
                  class="text-xs text-slate-300 p-2 rounded-lg bg-slate-800/30 cursor-pointer hover:bg-slate-800/60 transition"
                  @click="useQuickReply(reply.text)"
                >
                  {{ reply.label }}
                </div>
              </div>
            </div>

            <!-- Notes -->
            <div class="pt-4 border-t border-slate-800/60">
              <h5 class="text-xs font-medium text-slate-400 mb-2">Notes</h5>
              <el-input v-model="chatNotes" type="textarea" :rows="3" placeholder="Add notes about this visitor..." size="small" />
              <el-button size="small" type="primary" class="mt-2 w-full" @click="saveNotes">
                <Icon name="ph:floppy-disk-bold" class="w-3 h-3 mr-1" /> Save Notes
              </el-button>
            </div>

            <!-- Assignment -->
            <div class="pt-4 border-t border-slate-800/60">
              <h5 class="text-xs font-medium text-slate-400 mb-2">Assigned To</h5>
              <el-select v-model="activeChat.assignedAgent" placeholder="Assign agent" class="w-full" size="small">
                <el-option v-for="agent in agents" :key="agent.id" :label="agent.name" :value="agent.id" />
              </el-select>
            </div>
          </div>
        </template>

        <div v-else class="flex-1 flex flex-col items-center justify-center p-4">
          <Icon name="ph:info-bold" class="w-12 h-12 text-slate-600 mb-3" />
          <p class="text-xs text-slate-500 text-center">Visitor details will appear here when a chat is selected</p>
        </div>
      </div>
    </div>

    <!-- Transfer Dialog -->
    <el-dialog v-model="showTransferDialog" title="Transfer Chat" width="400px">
      <el-form label-position="top">
        <el-form-item label="Transfer To">
          <el-select v-model="transferTarget" placeholder="Select agent" class="w-full">
            <el-option v-for="agent in agents" :key="agent.id" :label="`${agent.name} (${agent.activeChats} active)`" :value="agent.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="Reason">
          <el-input v-model="transferReason" type="textarea" :rows="2" placeholder="Reason for transfer..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showTransferDialog = false">Cancel</el-button>
        <el-button type="primary" @click="transferChat">Transfer</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';

definePageMeta({ layout: 'default', middleware: 'permissions' });

const filterStatus = ref('');
const chatSearch = ref('');
const selectedChatId = ref<number | null>(null);
const messageText = ref('');
const chatNotes = ref('');
const isAvailable = ref(true);
const showTransferDialog = ref(false);
const transferTarget = ref<number | null>(null);
const transferReason = ref('');

interface ChatMessage {
  id: number;
  sender: 'agent' | 'visitor';
  text: string;
  time: string;
  read: boolean;
}

interface Chat {
  id: number;
  visitorName: string;
  visitorEmail: string;
  status: 'active' | 'waiting' | 'resolved';
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isTyping: boolean;
  assignedAgent: number | null;
  visitorInfo: {
    browser: string;
    location: string;
    currentPage: string;
  };
  messages: ChatMessage[];
}

const agents = ref([
  { id: 1, name: 'Ahmed Al-Farsi', activeChats: 3 },
  { id: 2, name: 'Sara Mohammed', activeChats: 2 },
  { id: 3, name: 'Omar Hassan', activeChats: 1 },
  { id: 4, name: 'Fatima Ali', activeChats: 4 },
]);

const quickReplies = ref([
  { id: 1, label: 'Welcome - greeting', text: 'Hello! Welcome to our support. How can I help you today?' },
  { id: 2, label: 'Please wait', text: 'Please hold on while I look into this for you.' },
  { id: 3, label: 'Transfer notice', text: 'I will transfer you to a specialist who can better assist you.' },
  { id: 4, label: 'Follow-up email', text: 'I will send you a follow-up email with the details we discussed.' },
  { id: 5, label: 'Closing', text: 'Is there anything else I can help you with?' },
]);

const chats = ref<Chat[]>([
  {
    id: 1, visitorName: 'Khalid Ibrahim', visitorEmail: 'khalid@techcorp.sa', status: 'active',
    lastMessage: 'Can you help me with the pricing page?', lastMessageTime: '2m ago', unreadCount: 2, isTyping: true, assignedAgent: 1,
    visitorInfo: { browser: 'Chrome 121 / Windows', location: 'Riyadh, SA', currentPage: '/pricing' },
    messages: [
      { id: 1, sender: 'visitor', text: 'Hi, I have a question about your enterprise plan.', time: '10:32 AM', read: true },
      { id: 2, sender: 'agent', text: 'Hello Khalid! Welcome. I would be happy to help you with the enterprise plan details.', time: '10:33 AM', read: true },
      { id: 3, sender: 'visitor', text: 'What is included in the enterprise tier? We have 200+ users.', time: '10:34 AM', read: true },
      { id: 4, sender: 'agent', text: 'Our enterprise plan includes unlimited users, priority support, custom integrations, and dedicated account management. For 200+ users, we can offer volume pricing.', time: '10:35 AM', read: true },
      { id: 5, sender: 'visitor', text: 'Can you help me with the pricing page?', time: '10:38 AM', read: false },
    ],
  },
  {
    id: 2, visitorName: 'Noura Salem', visitorEmail: 'noura@gulfbiz.com', status: 'active',
    lastMessage: 'The dashboard is loading slowly for me', lastMessageTime: '5m ago', unreadCount: 1, isTyping: false, assignedAgent: 2,
    visitorInfo: { browser: 'Safari 17 / macOS', location: 'Jeddah, SA', currentPage: '/dashboard' },
    messages: [
      { id: 1, sender: 'visitor', text: 'Hello, I am experiencing slow load times on the dashboard.', time: '10:25 AM', read: true },
      { id: 2, sender: 'agent', text: 'Hi Noura, sorry about that. Let me check on this right away.', time: '10:26 AM', read: true },
      { id: 3, sender: 'visitor', text: 'The dashboard is loading slowly for me', time: '10:35 AM', read: false },
    ],
  },
  {
    id: 3, visitorName: 'Hassan Al-Qahtani', visitorEmail: 'hassan@startup.sa', status: 'waiting',
    lastMessage: 'Is anyone available to help?', lastMessageTime: '8m ago', unreadCount: 3, isTyping: false, assignedAgent: null,
    visitorInfo: { browser: 'Firefox 122 / Linux', location: 'Dammam, SA', currentPage: '/support' },
    messages: [
      { id: 1, sender: 'visitor', text: 'Hi, I need help setting up the API integration.', time: '10:20 AM', read: false },
      { id: 2, sender: 'visitor', text: 'We are trying to connect our ERP system.', time: '10:22 AM', read: false },
      { id: 3, sender: 'visitor', text: 'Is anyone available to help?', time: '10:30 AM', read: false },
    ],
  },
  {
    id: 4, visitorName: 'Amal Rashid', visitorEmail: 'amal@retailco.sa', status: 'resolved',
    lastMessage: 'Thank you for your help!', lastMessageTime: '25m ago', unreadCount: 0, isTyping: false, assignedAgent: 1,
    visitorInfo: { browser: 'Chrome 121 / Android', location: 'Riyadh, SA', currentPage: '/settings' },
    messages: [
      { id: 1, sender: 'visitor', text: 'How do I change my account settings?', time: '09:50 AM', read: true },
      { id: 2, sender: 'agent', text: 'Go to Settings > Account and you will find all the options there.', time: '09:51 AM', read: true },
      { id: 3, sender: 'visitor', text: 'Thank you for your help!', time: '09:55 AM', read: true },
    ],
  },
  {
    id: 5, visitorName: 'Youssef Mansour', visitorEmail: 'youssef@finserv.sa', status: 'active',
    lastMessage: 'Can I export my reports to Excel?', lastMessageTime: '12m ago', unreadCount: 0, isTyping: false, assignedAgent: 3,
    visitorInfo: { browser: 'Edge 121 / Windows', location: 'Khobar, SA', currentPage: '/reports' },
    messages: [
      { id: 1, sender: 'visitor', text: 'Hi, quick question about report exports.', time: '10:15 AM', read: true },
      { id: 2, sender: 'agent', text: 'Sure! What do you need help with?', time: '10:16 AM', read: true },
      { id: 3, sender: 'visitor', text: 'Can I export my reports to Excel?', time: '10:18 AM', read: true },
      { id: 4, sender: 'agent', text: 'Absolutely. On any report page, click the Export button in the top-right corner and select XLSX format.', time: '10:19 AM', read: true },
    ],
  },
]);

const filteredChats = computed(() => {
  let result = chats.value;
  if (filterStatus.value) {
    result = result.filter(c => c.status === filterStatus.value);
  }
  if (chatSearch.value) {
    const s = chatSearch.value.toLowerCase();
    result = result.filter(c =>
      c.visitorName.toLowerCase().includes(s) || c.visitorEmail.toLowerCase().includes(s)
    );
  }
  return result;
});

const activeChat = computed(() => {
  if (selectedChatId.value === null) return null;
  return chats.value.find(c => c.id === selectedChatId.value) || null;
});

const activeChatsCount = computed(() => chats.value.filter(c => c.status === 'active').length);
const resolvedTodayCount = computed(() => chats.value.filter(c => c.status === 'resolved').length);

const getChatStatusType = (status: string): 'success' | 'warning' | 'info' | undefined => {
  const map: Record<string, 'success' | 'warning' | 'info' | undefined> = {
    active: 'success',
    waiting: 'warning',
    resolved: 'info',
  };
  return map[status];
};

const selectChat = (id: number) => {
  selectedChatId.value = id;
  const chat = chats.value.find(c => c.id === id);
  if (chat) {
    chat.unreadCount = 0;
    chat.messages.forEach(m => { m.read = true; });
  }
};

const sendMessage = () => {
  if (!messageText.value.trim() || !activeChat.value) return;
  const chat = activeChat.value;
  const newMsg: ChatMessage = {
    id: Date.now(),
    sender: 'agent',
    text: messageText.value.trim(),
    time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    read: false,
  };
  chat.messages.push(newMsg);
  chat.lastMessage = newMsg.text;
  chat.lastMessageTime = 'Just now';
  chat.isTyping = false;
  messageText.value = '';
};

const useQuickReply = (text: string) => {
  messageText.value = text;
};

const saveNotes = () => {
  ElMessage.success('Notes saved successfully');
};

const resolveChat = () => {
  if (!activeChat.value) return;
  activeChat.value.status = 'resolved';
  ElMessage.success(`Chat with ${activeChat.value.visitorName} resolved`);
};

const endChat = () => {
  if (!activeChat.value) return;
  activeChat.value.status = 'resolved';
  ElMessage.info(`Chat with ${activeChat.value.visitorName} ended`);
  selectedChatId.value = null;
};

const toggleAvailability = () => {
  isAvailable.value = !isAvailable.value;
  ElMessage.info(isAvailable.value ? 'You are now online' : 'You are now offline');
};

const transferChat = () => {
  if (!transferTarget.value) {
    ElMessage.warning('Please select an agent');
    return;
  }
  const agent = agents.value.find(a => a.id === transferTarget.value);
  ElMessage.success(`Chat transferred to ${agent?.name}`);
  showTransferDialog.value = false;
  transferTarget.value = null;
  transferReason.value = '';
};
</script>
