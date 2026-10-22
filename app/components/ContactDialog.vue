<script setup lang="ts">
const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const dialog = ref<HTMLDialogElement | null>(null)
const form = reactive({ name: '', email: '', message: '', website: '' })
const status = ref<'idle' | 'sending' | 'sent' | 'error'>('idle')
const errorText = ref('')

watch(() => props.open, (open) => {
  if (open && !dialog.value?.open) {
    if (status.value !== 'sending') status.value = 'idle'
    dialog.value?.showModal()
  }
  if (!open && dialog.value?.open) dialog.value.close()
}, { flush: 'post' })

function onBackdropClick(e: MouseEvent) {
  if (e.target === dialog.value) emit('close')
}

async function submit() {
  status.value = 'sending'
  try {
    await $fetch('/api/contact', { method: 'POST', body: form })
    Object.assign(form, { name: '', email: '', message: '', website: '' })
    status.value = 'sent'
  }
  catch (err) {
    errorText.value = (err as { statusMessage?: string }).statusMessage ?? 'Could not send the message'
    status.value = 'error'
  }
}
</script>

<template>
  <dialog ref="dialog" class="dialog" aria-labelledby="contact-title" @close="emit('close')" @click="onBackdropClick">
    <div class="panel">
      <header class="head">
        <h2 id="contact-title" class="title">Contact</h2>
        <button type="button" class="close" aria-label="Close" @click="emit('close')">✕</button>
      </header>

      <div v-if="status === 'sent'" class="body">
        <p class="note">Thanks, your message is on its way.</p>
        <button type="button" class="btn primary" @click="emit('close')">Close</button>
      </div>

      <form v-else class="body" @submit.prevent="submit">
        <label class="field">
          <span class="label">Name</span>
          <input v-model="form.name" type="text" maxlength="100" autocomplete="name">
        </label>
        <label class="field">
          <span class="label">Email</span>
          <input v-model="form.email" type="email" required autocomplete="email">
        </label>
        <label class="field">
          <span class="label">Message</span>
          <textarea v-model="form.message" required maxlength="5000" rows="5" />
        </label>
        <input v-model="form.website" class="trap" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
        <p v-if="status === 'error'" class="error" role="alert">{{ errorText }}</p>
        <button type="submit" class="btn primary" :disabled="status === 'sending'">
          {{ status === 'sending' ? 'Sending…' : 'Send' }}
        </button>
      </form>
    </div>
  </dialog>
</template>

<style scoped>
.dialog {
  width: min(420px, calc(100vw - 32px));
  max-height: calc(100dvh - 32px);
  padding: 0;
  border: 1px solid var(--border-strong);
  border-top: 2px solid var(--accent);
  border-radius: var(--radius);
  background: var(--panel);
  color: var(--text);
  overflow-y: auto;
}

.dialog::backdrop {
  background: rgb(0 0 0 / 0.65);
  backdrop-filter: blur(2px);
}

.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
}

.title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 800;
}

.close {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: none;
  color: var(--muted);
}

.close:hover {
  border-color: var(--muted);
  color: var(--text);
}

.body {
  display: grid;
  gap: 14px;
  padding: 16px;
}

.field {
  display: grid;
  gap: 6px;
}

.field input,
.field textarea {
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--text);
  font: inherit;
  font-size: 14px;
}

.field textarea {
  resize: vertical;
}

.field input:focus,
.field textarea:focus {
  outline: none;
  border-color: var(--accent);
}

.trap {
  position: absolute;
  left: -9999px;
}

.note {
  margin: 0;
}

.error {
  margin: 0;
  font-size: 13px;
  color: var(--danger);
}

.primary {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-soft);
}

.primary:hover:not(:disabled) {
  background: var(--accent);
  color: var(--bg);
}

.primary:disabled {
  opacity: 0.6;
  cursor: wait;
}
</style>
