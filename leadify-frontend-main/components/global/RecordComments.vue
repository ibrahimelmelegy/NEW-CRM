<template lang="pug">
.space-y-4
  //- Comment input
  .glass-card.p-4
    .flex.gap-3
      Avatar(:src="currentUser?.profilePicture || '/images/avatar.png'" :small="true")
      .flex-1
        el-input(v-model="newComment" type="textarea" :rows="2" :placeholder="$t('common.addComment') || 'Add a comment...'" resize="none")
        .flex.justify-end.mt-2
          el-button(type="primary" size="small" :loading="submitting" :disabled="!newComment.trim()" @click="submitComment" class="!rounded-xl") {{ $t('common.submit') }}

  //- Comments list
  .space-y-3(v-if="comments.length > 0")
    .glass-card.p-4(v-for="comment in comments" :key="comment.id")
      .flex.gap-3
        Avatar(:src="comment.user?.profilePicture || '/images/avatar.png'" small)
        .flex-1
          .flex.items-center.justify-between
            .flex.items-center.gap-2
              span.font-medium.text-sm(style="color: var(--text-primary)") {{ comment.user?.name || 'Unknown' }}
              span.text-xs(style="color: var(--text-muted)") {{ formatTimeAgo(comment.createdAt) }}
            el-dropdown(v-if="comment.userId === currentUser?.id" trigger="click" size="small")
              Icon.cursor-pointer(name="ph:dots-three-bold" size="16" style="color: var(--text-muted)")
              template(#dropdown)
                el-dropdown-menu
                  el-dropdown-item(@click="startEdit(comment)")
                    .flex.items-center
                      Icon(name="ph:pencil-bold" size="14" class="mr-2")
                      span {{ $t('common.edit') }}
                  el-dropdown-item(@click="deleteComment(comment.id)")
                    .flex.items-center.text-red-500
                      Icon(name="ph:trash-bold" size="14" class="mr-2")
                      span {{ $t('common.delete') }}
          //- Edit mode
          template(v-if="editingId === comment.id")
            el-input.mt-2(v-model="editContent" type="textarea" :rows="2" resize="none")
            .flex.gap-2.mt-2.justify-end
              el-button(size="small" @click="cancelEdit") {{ $t('common.cancel') }}
              el-button(type="primary" size="small" :loading="submitting" @click="saveEdit" class="!rounded-xl") {{ $t('common.save') }}
          //- Display mode
          p.mt-1.text-sm(v-else style="color: var(--text-secondary)") {{ comment.content }}

  //- Empty
  .text-center.py-6(v-else-if="!loading")
    p.text-sm(style="color: var(--text-muted)") {{ $t('common.noComments') || 'No comments yet' }}

  //- Loading
  .flex.justify-center.py-4(v-if="loading")
    el-spinner(size="default")
</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus';
import { user as currentUser } from '~/composables/useUser';

const props = defineProps<{
  entityType: string;
  entityId: string | number;
}>();

const comments = ref<any[]>([]);
const newComment = ref('');
const editingId = ref<number | null>(null);
const editContent = ref('');
const submitting = ref(false);
const loading = ref(false);

async function fetchComments() {
  loading.value = true;
  try {
    const { body, success } = await useApiFetch(`comments?entityType=${props.entityType}&entityId=${props.entityId}`);
    if (success && body) {
      comments.value = body.docs || body || [];
    }
  } finally {
    loading.value = false;
  }
}

async function submitComment() {
  if (!newComment.value.trim()) return;
  submitting.value = true;
  try {
    const { success } = await useApiFetch('comments', 'POST', {
      entityType: props.entityType,
      entityId: props.entityId,
      content: newComment.value
    });
    if (success) {
      newComment.value = '';
      await fetchComments();
    }
  } finally {
    submitting.value = false;
  }
}

function startEdit(comment: any) {
  editingId.value = comment.id;
  editContent.value = comment.content;
}

function cancelEdit() {
  editingId.value = null;
  editContent.value = '';
}

async function saveEdit() {
  if (!editingId.value || !editContent.value.trim()) return;
  submitting.value = true;
  try {
    const { success } = await useApiFetch(`comments/${editingId.value}`, 'PUT', { content: editContent.value });
    if (success) {
      cancelEdit();
      await fetchComments();
    }
  } finally {
    submitting.value = false;
  }
}

async function deleteComment(id: number) {
  const { success } = await useApiFetch(`comments/${id}`, 'DELETE');
  if (success) await fetchComments();
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

onMounted(() => fetchComments());
watch(() => [props.entityType, props.entityId], () => fetchComments());
</script>
