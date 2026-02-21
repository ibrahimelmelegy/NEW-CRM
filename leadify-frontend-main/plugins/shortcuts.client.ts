import { useKeyboardShortcuts } from '~/composables/useKeyboardShortcuts';
import { openSpotlightDirect } from '~/composables/useSpotlight';

export default defineNuxtPlugin(() => {
  const router = useRouter();
  const { register, handleKeyDown } = useKeyboardShortcuts();

  // ── Navigation (chord: G then ...) ──
  register({
    keys: 'G then D',
    label: 'Go to Dashboard',
    category: 'Navigation',
    action: () => router.push('/')
  });
  register({
    keys: 'G then L',
    label: 'Go to Leads',
    category: 'Navigation',
    action: () => router.push('/sales/leads')
  });
  register({
    keys: 'G then E',
    label: 'Go to Deals',
    category: 'Navigation',
    action: () => router.push('/sales/deals')
  });
  register({
    keys: 'G then C',
    label: 'Go to Clients',
    category: 'Navigation',
    action: () => router.push('/sales/clients')
  });
  register({
    keys: 'G then T',
    label: 'Go to Tasks',
    category: 'Navigation',
    action: () => router.push('/operations/daily-task')
  });
  register({
    keys: 'G then K',
    label: 'Go to Kanban',
    category: 'Navigation',
    action: () => router.push('/sales/deals/kanban')
  });
  register({
    keys: 'G then A',
    label: 'Go to Analytics',
    category: 'Navigation',
    action: () => router.push('/reports')
  });
  register({
    keys: 'G then S',
    label: 'Go to Staff',
    category: 'Navigation',
    action: () => router.push('/staff')
  });
  register({
    keys: 'G then R',
    label: 'Go to Roles',
    category: 'Navigation',
    action: () => router.push('/roles')
  });
  register({
    keys: 'G then P',
    label: 'Go to Projects',
    category: 'Navigation',
    action: () => router.push('/operations/projects')
  });

  // ── Quick Create (chord: C then ...) ──
  register({
    keys: 'C then L',
    label: 'Create Lead',
    category: 'Quick Create',
    action: () => router.push('/sales/leads/add-lead')
  });
  register({
    keys: 'C then D',
    label: 'Create Deal',
    category: 'Quick Create',
    action: () => router.push('/sales/deals/add-deal')
  });
  register({
    keys: 'C then T',
    label: 'Create Task',
    category: 'Quick Create',
    action: () => router.push('/operations/daily-task/add-daily-task')
  });
  register({
    keys: 'C then P',
    label: 'Create Project',
    category: 'Quick Create',
    action: () => router.push('/operations/projects/add-project')
  });
  register({
    keys: 'C then O',
    label: 'Create Opportunity',
    category: 'Quick Create',
    action: () => router.push('/sales/opportunity/add-opportunity')
  });

  // ── Actions ──
  register({
    keys: 'Ctrl+K',
    label: 'Open Spotlight Search',
    category: 'Actions',
    action: () => openSpotlightDirect()
  });

  // ── General (display-only shortcuts) ──
  register({
    keys: '?',
    label: 'Show Keyboard Shortcuts',
    category: 'General',
    action: () => {} // Handled directly in handleKeyDown
  });
  register({
    keys: 'Escape',
    label: 'Close Modal / Overlay',
    category: 'General',
    action: () => {} // Handled directly in handleKeyDown
  });
  register({
    keys: 'Alt+K',
    label: 'Open Spotlight Search',
    category: 'Actions',
    action: () => openSpotlightDirect()
  });

  // Attach global keyboard listener
  window.addEventListener('keydown', handleKeyDown);
});
