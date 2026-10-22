<script setup lang="ts">
const props = defineProps<{ setId: string }>()

const open = ref(false)
const reason = ref<ReportReason | null>(null)
const note = ref('')
const website = ref('')
const status = ref<'idle' | 'sending' | 'sent' | 'error'>('idle')
const errorText = ref('')

const reasons = Object.entries(REPORT_REASONS) as [ReportReason, string][]

async function submit() {
  if (!reason.value) return
  status.value = 'sending'
  try {
    await $fetch('/api/report', {
      method: 'POST',
      body: { id: props.setId, reason: reason.value, note: note.value, website: website.value },
    })
    status.value = 'sent'
  }
  catch (err) {
    errorText.value = (err as { statusMessage?: string }).statusMessage ?? 'Could not send the report'
    status.value = 'error'
  }
}
</script>

<template>
  <section class="report">
    <p v-if="status === 'sent'" class="done">Thanks, the report is in.</p>

    <button v-else-if="!open" type="button" class="toggle" @click="open = true">
      ⚑ Report a problem with this set
    </button>

    <form v-else class="form" @submit.prevent="submit">
      <p class="label">What's wrong?</p>
      <div class="reasons" role="radiogroup" aria-label="Reason">
        <button
          v-for="[value, label] in reasons"
          :key="value"
          type="button"
          role="radio"
          class="chip"
          :class="{ on: reason === value }"
          :aria-checked="reason === value"
          @click="reason = value"
        >
          {{ label }}
        </button>
      </div>
      <textarea v-model="note" class="note" rows="2" maxlength="1000" placeholder="Details (optional)" aria-label="Details" />
      <input v-model="website" class="trap" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
      <p v-if="status === 'error'" class="error" role="alert">{{ errorText }}</p>
      <div class="buttons">
        <button type="button" class="btn" @click="open = false">Cancel</button>
        <button type="submit" class="btn send" :disabled="!reason || status === 'sending'">
          {{ status === 'sending' ? 'Sending…' : 'Send report' }}
        </button>
      </div>
    </form>
  </section>
</template>

<style scoped>
.report {
  padding: 0 16px 14px;
}

.toggle {
  padding: 0;
  border: 0;
  background: none;
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--dim);
}

.toggle:hover {
  color: var(--danger);
}

.form {
  display: grid;
  gap: 10px;
  padding-top: 14px;
  border-top: 1px solid var(--border);
}

.form .label {
  margin: 0;
}

.reasons {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.note {
  width: 100%;
  padding: 0.5rem 0.65rem;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--text);
  font: inherit;
  font-size: 13px;
  resize: vertical;
}

.note:focus {
  outline: none;
  border-color: var(--accent);
}

.trap {
  position: absolute;
  left: -9999px;
}

.buttons {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.send {
  border-color: var(--danger);
  color: var(--danger);
}

.send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.done,
.error {
  margin: 0;
  font-size: 13px;
}

.done {
  color: var(--accent);
}

.error {
  color: var(--danger);
}
</style>
