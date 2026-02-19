export function useEmailComposer() {
  const templates = ref<any[]>([]);
  const selectedTemplate = ref<any>(null);
  const loading = ref(false);
  const composerVisible = ref(false);

  // Email form state
  const emailForm = reactive({
    to: '',
    subject: '',
    body: '',
    cc: '',
    bcc: ''
  });

  // Context data for variable injection
  const context = ref<Record<string, string>>({});

  // Available variables for template placeholders
  const availableVariables = [
    'firstName',
    'lastName',
    'companyName',
    'dealName',
    'proposalLink',
    'senderName',
    'email',
    'phone'
  ];

  async function fetchTemplates() {
    loading.value = true;
    try {
      const { body, success } = await useApiFetch('email/templates');
      if (success && body) {
        templates.value = body as any[];
      }
    } catch (err) {
      console.error('Failed to fetch email templates:', err);
    } finally {
      loading.value = false;
    }
  }

  function selectTemplate(template: any) {
    selectedTemplate.value = template;
    emailForm.subject = injectVariables(template.subject);
    emailForm.body = injectVariables(template.body);
  }

  function injectVariables(text: string): string {
    if (!text) return '';
    let result = text;
    for (const [key, value] of Object.entries(context.value)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, value);
    }
    return result;
  }

  function openComposer(contextData?: Record<string, string>) {
    if (contextData) {
      context.value = { ...contextData };
    }
    composerVisible.value = true;
    fetchTemplates();
  }

  function closeComposer() {
    composerVisible.value = false;
    resetForm();
  }

  function resetForm() {
    emailForm.to = '';
    emailForm.subject = '';
    emailForm.body = '';
    emailForm.cc = '';
    emailForm.bcc = '';
    selectedTemplate.value = null;
  }

  function getSuggestedSubjects(category: string): string[] {
    const suggestions: Record<string, string[]> = {
      'follow-up': [
        'Following up on our conversation',
        'Quick follow-up regarding {{dealName}}',
        'Checking in - {{companyName}}'
      ],
      introduction: [
        'Introduction - {{companyName}}',
        'Nice to connect, {{firstName}}',
        'Reaching out from our team'
      ],
      proposal: [
        'Proposal for {{dealName}}',
        'Your customized proposal - {{companyName}}',
        'Partnership proposal'
      ],
      'thank-you': [
        'Thank you, {{firstName}}!',
        'Grateful for the partnership',
        'Thanks for choosing us'
      ],
      'win-back': [
        'We miss you, {{firstName}}!',
        'Let us reconnect - {{companyName}}',
        'Exciting updates to share'
      ]
    };
    return suggestions[category] || [];
  }

  // Best send time recommendation (simple heuristic rules)
  const bestSendTime = computed(() => {
    const now = new Date();
    const day = now.getDay();
    // Weekend
    if (day === 0 || day === 6) return 'Monday 10:00 AM';
    // Early morning
    if (now.getHours() < 10) return 'Today 10:00 AM';
    // Late morning / early afternoon
    if (now.getHours() < 14) return 'Today 2:00 PM';
    // After 2 PM
    return 'Tomorrow 10:00 AM';
  });

  return {
    templates,
    selectedTemplate,
    loading,
    composerVisible,
    emailForm,
    context,
    availableVariables,
    bestSendTime,
    fetchTemplates,
    selectTemplate,
    injectVariables,
    openComposer,
    closeComposer,
    resetForm,
    getSuggestedSubjects
  };
}
