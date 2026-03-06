<template lang="pug">
ol(vocab='http://schema.org/' typeof='BreadcrumbList' class="breadcrumb" )
  li(property='itemListElement' typeof='ListItem')
    NuxtLink(property='item' typeof='WebPage' :to="'/'" )
      span(property='name')
        Icon(name='solar:home-angle-outline')
    meta(property='position' content='1')
  li(v-for='(crumb, index) in crumbs'  :key='index' property='itemListElement' typeof='ListItem')
    NuxtLink.text-xs(property='item' typeof='WebPage' :to='crumb.path' class="breadcrumbLink")
      span(property='name') {{    $route.fullPath === crumb.path && title !== null ? title : crumb.title }}
    meta(property='position' :content='index + 2')

</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: null
  }
});

const route = useRoute();
const router = useRouter();

const crumbs = computed(() => {
  const fullPath = route.fullPath.replace('/ar', '');
  const params = fullPath.startsWith('/') ? fullPath.substring(1).split('/') : fullPath.split('/');
  const crumbs = [];
  let path = '';
  params.forEach((param, index) => {
    path = `${path}/${param}`;
    const match = router.resolve(path);
    if (match.name !== null) {
      crumbs.push({
        title: param.replace(/-/g, ' ').split('?')[0],
        ...match
      });
    }
  });
  return crumbs;
});
</script>

<style lang="scss">
ol {
  list-style: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;

  li {
    display: inline;

    &:after {
      content: ' » ';
      display: inline;
      color: var(--text-muted);
      padding: 0 0.0725em 0 0.15em;
    }

    &:last-child:after {
      content: '';
    }

    a {
      color: var(--text-primary);
    }

    span {
      max-width: 150px;
      display: inline-block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      vertical-align: bottom;
    }
  }
}
.breadcrumb {
  .router-link-active {
    color: var(--text-primary) !important;
    background-color: transparent !important;
    font-weight: 600;
  }
}
</style>
