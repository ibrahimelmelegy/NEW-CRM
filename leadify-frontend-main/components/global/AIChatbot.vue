<template lang="pug">
.ai-chatbot-container
  //- Floating Button
  button.floating-chat-btn(@click="toggleChat" :class="{ 'is-open': isOpen }")
    transition(name="icon-flip" mode="out-in")
      Icon(v-if="!isOpen" name="ph:sparkle-bold" size="28" key="sparkle")
      Icon(v-else name="ph:x-bold" size="28" key="close")

  //- Chat Window
  transition(name="slide-up")
    .chat-window.glass-card(v-show="isOpen")
      //- Header
      .chat-header
        .flex.items-center.gap-3
          .assistant-avatar
            Icon(name="ph:robot-bold" size="22" class="text-white")
          div
            h4.font-bold.text-sm {{ $t('ai.assistant') }}
            p.online-status
              span.status-dot
              | {{ $t('ai.onlineReady') }}
        .header-actions
          el-tooltip(:content="$t('ai.clearChat')" placement="top")
            button.header-btn(@click="handleClearChat")
              Icon(name="ph:trash-bold" size="16")
          button.header-btn(@click="toggleChat")
            Icon(name="ph:minus-bold" size="16")

      //- Messages Area
      .chat-messages(ref="msgContainer")
        //- Welcome state when no messages
        .welcome-state(v-if="chatHistory.length === 0")
          .welcome-icon
            Icon(name="ph:sparkle-bold" size="40")
          p.welcome-text {{ $t('ai.welcomeMessage') }}
          .example-prompts
            button.prompt-chip(
              v-for="prompt in examplePrompts"
              :key="prompt"
              @click="sendExamplePrompt(prompt)"
            ) {{ prompt }}

        //- Message list
        template(v-else)
          .message(
            v-for="(msg, i) in chatHistory"
            :key="i"
            :class="msg.role"
          )
            .msg-avatar(v-if="msg.role === 'assistant'")
              Icon(name="ph:robot-bold" size="14" class="text-white")
            .msg-bubble
              .msg-content(v-html="formatMarkdown(msg.content)")
            .msg-avatar.user-avatar(v-if="msg.role === 'user'")
              Icon(name="ph:user-bold" size="14" class="text-white")

        //- Typing indicator
        .message.assistant(v-if="isChatLoading")
          .msg-avatar
            Icon(name="ph:robot-bold" size="14" class="text-white")
          .msg-bubble
            .typing-indicator
              span.dot
              span.dot
              span.dot

      //- Input Area
      .chat-input
        el-input(
          v-model="input"
          :placeholder="$t('ai.askPlaceholder')"
          @keyup.enter="sendMessage"
          :disabled="isChatLoading"
          size="large"
        )
          template(#prefix)
            Icon(name="ph:chat-text-bold" size="18" class="text-gray-400")
          template(#suffix)
            button.send-btn(
              @click="sendMessage"
              :disabled="!input.trim() || isChatLoading"
              :class="{ 'active': input.trim() }"
            )
              Icon(name="ph:paper-plane-right-fill" size="20")
</template>

<script setup lang="ts">
import { useAI } from '~/composables/useAI';

const { t } = useI18n();
const { chatHistory, isChatLoading, askCRM, clearChat } = useAI();

const isOpen = ref(false);
const input = ref('');
const msgContainer = ref<HTMLElement | null>(null);

const examplePrompts = [
    'How many deals this month?',
    'Show pipeline summary',
    'Top clients by revenue',
    'Overdue invoices',
    'Lead status breakdown',
];

function toggleChat() {
    isOpen.value = !isOpen.value;
}

async function sendMessage() {
    const question = input.value.trim();
    if (!question || isChatLoading.value) return;

    input.value = '';
    await askCRM(question);
    scrollToBottom();
}

function sendExamplePrompt(prompt: string) {
    input.value = prompt;
    sendMessage();
}

async function handleClearChat() {
    await clearChat();
}

function scrollToBottom() {
    nextTick(() => {
        if (msgContainer.value) {
            msgContainer.value.scrollTop = msgContainer.value.scrollHeight;
        }
    });
}

function formatMarkdown(text: string): string {
    if (!text) return '';
    // Bold
    let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Line breaks
    html = html.replace(/\n/g, '<br>');
    // Bullet points
    html = html.replace(/^- (.*?)(<br>|$)/gm, '<span class="bullet-item">$1</span><br>');
    return html;
}

// Watch for new messages to auto-scroll
watch(
    () => chatHistory.value.length,
    () => scrollToBottom()
);
</script>

<style lang="scss" scoped>
.ai-chatbot-container {
    position: fixed;
    bottom: 30px;
    inset-inline-end: 30px;
    z-index: 9999;
}

.floating-chat-btn {
    width: 60px;
    height: 60px;
    border-radius: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #5b21b6 100%);
    color: white;
    border: none;
    cursor: pointer;
    box-shadow: 0 8px 32px rgba(124, 58, 237, 0.4);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;

    &::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%);
        border-radius: inherit;
    }

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 40px rgba(124, 58, 237, 0.5);
    }

    &.is-open {
        border-radius: 50%;
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        box-shadow: 0 8px 32px rgba(239, 68, 68, 0.4);
    }
}

.chat-window {
    position: absolute;
    bottom: 75px;
    inset-inline-end: 0;
    width: 400px;
    height: 520px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-radius: 20px !important;
    background: var(--glass-bg);
    backdrop-filter: var(--glass-blur);
    -webkit-backdrop-filter: var(--glass-blur);
    border: 1px solid var(--glass-border-color);
    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05);

    @media (max-width: 480px) {
        width: calc(100vw - 20px);
        height: calc(100vh - 120px);
        bottom: 75px;
        inset-inline-end: -20px;
    }
}

.chat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 18px;
    border-bottom: 1px solid var(--glass-border-color);
    background: rgba(124, 58, 237, 0.08);

    .assistant-avatar {
        width: 36px;
        height: 36px;
        border-radius: 12px;
        background: linear-gradient(135deg, #7c3aed, #6d28d9);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    h4 {
        color: var(--text-primary);
        margin: 0;
        line-height: 1.2;
    }

    .online-status {
        font-size: 11px;
        color: #10b981;
        display: flex;
        align-items: center;
        gap: 4px;
        margin: 0;

        .status-dot {
            width: 6px;
            height: 6px;
            background: #10b981;
            border-radius: 50%;
            display: inline-block;
            animation: pulse-dot 2s ease-in-out infinite;
        }
    }
}

.header-actions {
    display: flex;
    gap: 4px;

    .header-btn {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: transparent;
        border: none;
        color: var(--text-primary);
        cursor: pointer;
        opacity: 0.6;
        transition: all 0.2s;

        &:hover {
            opacity: 1;
            background: rgba(124, 58, 237, 0.1);
        }
    }
}

.chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;

    &::-webkit-scrollbar {
        width: 4px;
    }

    &::-webkit-scrollbar-thumb {
        background: rgba(124, 58, 237, 0.3);
        border-radius: 4px;
    }
}

.welcome-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 12px;
    text-align: center;

    .welcome-icon {
        width: 64px;
        height: 64px;
        border-radius: 20px;
        background: linear-gradient(135deg, rgba(124, 58, 237, 0.15), rgba(109, 40, 217, 0.08));
        display: flex;
        align-items: center;
        justify-content: center;
        color: #7c3aed;
    }

    .welcome-text {
        color: var(--text-primary);
        font-size: 13px;
        opacity: 0.8;
        max-width: 280px;
        margin: 0;
    }

    .example-prompts {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        justify-content: center;
        margin-top: 8px;
        padding: 0 8px;
    }

    .prompt-chip {
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 11px;
        background: rgba(124, 58, 237, 0.08);
        border: 1px solid rgba(124, 58, 237, 0.2);
        color: var(--text-primary);
        cursor: pointer;
        transition: all 0.2s;
        white-space: nowrap;

        &:hover {
            background: rgba(124, 58, 237, 0.15);
            border-color: rgba(124, 58, 237, 0.4);
        }
    }
}

.message {
    display: flex;
    gap: 8px;
    max-width: 90%;
    animation: fadeInUp 0.3s ease;

    &.user {
        align-self: flex-end;
        flex-direction: row;

        .msg-bubble {
            background: linear-gradient(135deg, #7c3aed, #6d28d9);
            color: white;
            border-radius: 16px 16px 4px 16px;
        }
    }

    &.assistant {
        align-self: flex-start;

        .msg-bubble {
            background: var(--bg-card-hover, rgba(255, 255, 255, 0.06));
            color: var(--text-primary);
            border-radius: 16px 16px 16px 4px;
            border: 1px solid var(--glass-border-color);
        }
    }

    .msg-avatar {
        width: 26px;
        height: 26px;
        min-width: 26px;
        border-radius: 8px;
        background: linear-gradient(135deg, #7c3aed, #5b21b6);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-top: 2px;

        &.user-avatar {
            background: linear-gradient(135deg, #6366f1, #4f46e5);
        }
    }

    .msg-bubble {
        padding: 10px 14px;
        font-size: 13px;
        line-height: 1.5;

        .msg-content {
            :deep(strong) {
                font-weight: 700;
            }

            :deep(.bullet-item) {
                display: block;
                padding-left: 12px;
                position: relative;

                &::before {
                    content: '\2022';
                    position: absolute;
                    left: 0;
                }
            }
        }
    }
}

.typing-indicator {
    display: flex;
    gap: 4px;
    padding: 4px 0;

    .dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #7c3aed;
        animation: typingBounce 1.4s ease-in-out infinite;

        &:nth-child(2) { animation-delay: 0.2s; }
        &:nth-child(3) { animation-delay: 0.4s; }
    }
}

.chat-input {
    padding: 12px 16px;
    border-top: 1px solid var(--glass-border-color);
    background: rgba(0, 0, 0, 0.05);

    :deep(.el-input__wrapper) {
        border-radius: 14px;
        background: var(--glass-bg, rgba(255, 255, 255, 0.06));
        border: 1px solid var(--glass-border-color);
        box-shadow: none;
        padding: 4px 12px;

        &:hover,
        &.is-focus {
            border-color: rgba(124, 58, 237, 0.4);
            box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.1);
        }
    }

    :deep(.el-input__inner) {
        color: var(--text-primary);
        font-size: 13px;

        &::placeholder {
            color: var(--text-primary);
            opacity: 0.4;
        }
    }

    .send-btn {
        background: none;
        border: none;
        color: var(--text-primary);
        opacity: 0.3;
        cursor: pointer;
        padding: 4px;
        display: flex;
        align-items: center;
        transition: all 0.2s;

        &.active {
            opacity: 1;
            color: #7c3aed;
        }

        &:disabled {
            cursor: not-allowed;
        }
    }
}

// ===== Animations =====
.slide-up-enter-active,
.slide-up-leave-active {
    transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-up-enter-from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
}
.slide-up-leave-to {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
}

.icon-flip-enter-active,
.icon-flip-leave-active {
    transition: all 0.2s ease;
}
.icon-flip-enter-from {
    opacity: 0;
    transform: rotate(-90deg) scale(0.5);
}
.icon-flip-leave-to {
    opacity: 0;
    transform: rotate(90deg) scale(0.5);
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(8px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes typingBounce {
    0%, 60%, 100% { transform: translateY(0); }
    30% { transform: translateY(-6px); }
}

@keyframes pulse-dot {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}
</style>
