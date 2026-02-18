<template lang="pug">
.kb-article-page.p-8
  .mb-6
    el-button(text @click="navigateTo('/support/knowledge-base')" class="!rounded-xl")
      Icon(name="ph:arrow-left-bold" size="16" aria-label="Back")
      span.ml-1 {{ $t('knowledgeBase.backToArticles') }}

  .glass-card.p-8(v-if="article" style="max-width: 900px; margin: 0 auto")
    .mb-6
      .flex.items-center.gap-2.mb-3
        el-tag(v-if="article.category" size="small") {{ article.category }}
        .text-xs(style="color: var(--text-muted)") {{ new Date(article.createdAt).toLocaleDateString() }}
        .text-xs(style="color: var(--text-muted)") {{ $t('knowledgeBase.views') }}: {{ article.viewCount }}
      h1.text-3xl.font-bold.mb-2(style="color: var(--text-primary)") {{ article.title }}
      p.text-sm(v-if="article.author" style="color: var(--text-muted)") {{ $t('knowledgeBase.by') }} {{ article.author.name }}

    .article-content.prose(style="color: var(--text-primary)" v-html="renderedContent")

    .mt-8.pt-6(style="border-top: 1px solid var(--border-default)")
      .flex.items-center.gap-4
        p.text-sm(style="color: var(--text-muted)") {{ $t('knowledgeBase.wasHelpful') }}
        el-button(size="small" @click="handleHelpful" :disabled="voted" class="!rounded-lg")
          Icon(name="ph:thumbs-up-bold" size="14" aria-label="Helpful")
          span.ml-1 {{ $t('knowledgeBase.helpful') }} ({{ article.helpfulCount }})

  //- Record tabs
  el-tabs.mt-6(v-if="article" v-model="activeTab")
    el-tab-pane(:label="$t('common.comments')" name="comments")
      RecordComments(:entityType="'knowledgeBase'" :entityId="route.params.slug as string")

  .text-center.py-16(v-else-if="!loading")
    Icon(name="ph:article" size="48" style="color: var(--text-muted)" aria-label="Not found")
    p.text-lg.mt-3(style="color: var(--text-muted)") {{ $t('knowledgeBase.notFound') }}
</template>

<script setup lang="ts">
import type { KBArticle } from '~/composables/useKnowledgeBase';
import { fetchArticleBySlug, markArticleHelpful } from '~/composables/useKnowledgeBase';

const route = useRoute();
const article = ref<KBArticle | null>(null);
const loading = ref(true);
const voted = ref(false);
const activeTab = ref('comments');

const renderedContent = computed(() => {
  if (!article.value?.content) return '';
  // Basic markdown-like rendering (paragraphs and line breaks)
  return article.value.content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');
});

onMounted(async () => {
  const slug = route.params.slug as string;
  article.value = await fetchArticleBySlug(slug);
  loading.value = false;
});

async function handleHelpful() {
  if (!article.value || voted.value) return;
  const result = await markArticleHelpful(article.value.id);
  if (result.success) {
    article.value.helpfulCount++;
    voted.value = true;
  }
}
</script>

<style scoped>
.kb-article-page { animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.article-content :deep(p) { margin-bottom: 1em; line-height: 1.7; }
</style>
