<template lang="pug">
node-view-wrapper.cover-page-wrapper
  .cover-page.relative(:style="coverStyle")
    .cover-overlay.absolute.inset-0(style="background: linear-gradient(135deg, rgba(15,23,42,0.95), rgba(41,37,36,0.3)); z-index: 1;")
    .cover-content.flex.flex-col.justify-end.h-full.p-16.relative(style="z-index: 2; color: white; min-height: 297mm;")
      
      .brand-box.mb-auto.flex.items-center.gap-3
        .logo-placeholder.w-12.h-12.rounded-lg.flex.items-center.justify-center(style="background: var(--primary-color, #7849ff); box-shadow: 0 4px 20px rgba(120,73,255,0.4)")
          Icon(name="ph:diamond-fill" size="24" color="white")
        .text-2xl.font-bold.tracking-widest LEADIFY

      .main-info.mt-auto
        .date-badge.mb-6.inline-block.px-4.py-2.rounded-full.text-sm.font-semibold.tracking-wider(style="background: rgba(255,255,255,0.15); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.2)") 
          | {{ node.attrs.date }}
        
        h1.cover-title.text-6xl.font-extrabold.leading-tight.mb-4(
          contenteditable="true" 
          @blur="updateTitle"
          style="text-shadow: 0 4px 12px rgba(0,0,0,0.5)"
        ) {{ node.attrs.title }}
        
        h2.cover-subtitle.text-2xl.text-gray-300.font-light.max-w-3xl(
          contenteditable="true" 
          @blur="updateSubtitle"
        ) {{ node.attrs.subtitle }}
        
        .cover-footer.mt-16.pt-8.flex.justify-between.items-end(style="border-top: 1px solid rgba(255,255,255,0.2)")
          div
            .text-sm.text-gray-400.uppercase.tracking-widest.mb-2 PREPARED BY
            .font-medium.text-xl(
              contenteditable="true" 
              @blur="updatePreparedBy"
            ) {{ node.attrs.preparedBy }}
          div.text-right
            .text-sm.text-gray-400.uppercase.tracking-widest.mb-2 PREPARED FOR
            .font-medium.text-xl Client / Prospect
          
  //- Control bar (only shown on hover in editor)
  .control-bar.flex.gap-2.absolute.top-6.right-6.transition-all.duration-300(style="z-index: 50;")
    el-button(size="small" type="primary" circle @click="changeImage") 
      Icon(name="ph:image" size="16")
    el-button(size="small" type="danger" circle @click="deleteNode") 
      Icon(name="ph:trash" size="16")
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { nodeViewProps, NodeViewWrapper } from '@tiptap/vue-3'

const props = defineProps(nodeViewProps)

const coverStyle = computed(() => {
  return {
    backgroundImage: `url(${props.node.attrs.coverImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    minHeight: '297mm', // Strict A4 Height
    margin: '-40px -60px 40px -60px', // Break out of A4 padding (assuming 40px TB, 60px LR)
    width: 'calc(100% + 120px)',
    borderRadius: '8px 8px 0 0',
    overflow: 'hidden',
    boxSizing: 'border-box'
  }
})

function updateTitle(e: Event) {
  props.updateAttributes({ title: (e.target as HTMLElement).innerText })
}
function updateSubtitle(e: Event) {
  props.updateAttributes({ subtitle: (e.target as HTMLElement).innerText })
}
function updatePreparedBy(e: Event) {
  props.updateAttributes({ preparedBy: (e.target as HTMLElement).innerText })
}

function changeImage() {
  const url = prompt('Enter new image URL:', props.node.attrs.coverImage)
  if (url) {
    props.updateAttributes({ coverImage: url })
  }
}

function deleteNode() {
  props.deleteNode()
}
</script>

<style scoped>
.cover-page-wrapper {
  position: relative;
  page-break-after: always; /* Ensure PDF breaks page after cover */
}

/* Hide controls by default */
.control-bar {
  opacity: 0;
  transform: translateY(-10px);
}

.cover-page-wrapper:hover .control-bar {
  opacity: 1;
  transform: translateY(0);
}

[contenteditable="true"]:hover {
  background: rgba(255,255,255,0.1);
  border-radius: 4px;
}
[contenteditable="true"]:focus {
  background: rgba(0,0,0,0.4);
  outline: 2px solid var(--primary-color, #7849ff);
  border-radius: 4px;
}
</style>
