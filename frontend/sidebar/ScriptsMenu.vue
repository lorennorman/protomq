<template>
  <h3 class="section-toggle" @click="sectionOpen = !sectionOpen">
    {{ sectionOpen ? '&#9660;' : '&#9654;' }} Scripts
  </h3>

  <div v-if="sectionOpen" class="scripts-section">
    <label class="fallback-checkin-label">
      <input type="checkbox"
        :checked="fallbackCheckinEnabled"
        @change="toggleFallbackCheckin">
      Fallback checkin
    </label>

    <div v-if="loading" class="scripts-status">Loading...</div>
    <div v-else-if="!scripts.length" class="scripts-status">No scripts loaded</div>

    <div v-for="script in scripts" :key="script.filename" class="script-item">
      <div class="script-header" :class="{ active: script.active }" @click="toggleExpanded(script.filename)">
        <span class="expand-icon">{{ expanded[script.filename] ? '&#9660;' : '&#9654;' }}</span>
        <span class="script-name">{{ script.name }}</span>
        <span v-if="script.active" class="active-badge">active</span>
      </div>

      <div v-if="expanded[script.filename]" class="script-details">
        <p v-if="script.description" class="script-desc">{{ script.description }}</p>

        <div class="script-controls">
          <button v-if="!script.active" @click="activate(script.filename)">Activate</button>
          <button v-if="script.active" @click="deactivate()">Deactivate</button>
          <button v-if="script.active" @click="reset(script.filename)">Reset</button>
          <label class="auto-reset-label">
            <input type="checkbox"
              :checked="getAutoReset(script.filename)"
              @change="toggleAutoReset(script.filename)">
            Auto-reset
          </label>
        </div>

        <ul class="step-list">
          <template v-for="step in script.steps" :key="step.name">
            <li v-if="step.delay && (step.after || step.waitFor)" class="step-item delay-row">
              <input type="checkbox"
                :checked="!isDisabled(script.filename, step.name + ':delay')"
                @change="toggleDisabled(script.filename, step.name + ':delay')"
                title="Enable/disable this delay">
              <span class="delay-label">
                {{ step.waitFor ? 'waitFor: ' + step.waitFor + ' +' : '' }} {{ step.delay }}ms
              </span>
            </li>
            <li class="step-item">
              <input type="checkbox"
                :checked="!isDisabled(script.filename, step.name)"
                @change="toggleDisabled(script.filename, step.name)"
                title="Enable/disable this step">
              <span class="step-name" :class="{
                completed: script.completedSteps?.includes(step.name),
                disabled: isDisabled(script.filename, step.name)
              }">
                {{ step.name }}
              </span>
              <span v-if="step.trigger" class="step-tag trigger">on: {{ step.trigger }}</span>
              <span v-if="step.after" class="step-tag after">after: {{ step.after }}</span>
              <span v-if="step.waitFor && !step.delay" class="step-tag waitfor">waitFor: {{ step.waitFor }}</span>
              <button v-if="step.hasSend || step.hasResponse" class="edit-btn" @click="editStep(step)" title="Open in message form">
                Edit
              </button>
              <button v-if="step.hasSend || step.hasResponse" class="send-btn" @click="sendStep(script.filename, step.name)">
                Send
              </button>
            </li>
          </template>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, reactive, onMounted } from 'vue'
  import { useMessageStore } from '/frontend/stores/message'
  import { findProtoBy } from '/frontend/protobuf_service'

  const
    messageStore = useMessageStore(),
    sectionOpen = ref(true),
    scripts = ref([]),
    loading = ref(true),
    fallbackCheckinEnabled = ref(true),
    expanded = reactive({}),
    disabledSteps = reactive({}),  // { filename: Set<stepName> }
    autoResetState = reactive({})  // { filename: boolean } — default true

  const getAutoReset = (filename) => autoResetState[filename] !== false

  const toggleAutoReset = (filename) => {
    autoResetState[filename] = !getAutoReset(filename)
  }

  const isDisabled = (filename, stepName) => disabledSteps[filename]?.has(stepName)

  const toggleDisabled = (filename, stepName) => {
    if (!disabledSteps[filename]) disabledSteps[filename] = new Set()
    if (disabledSteps[filename].has(stepName)) {
      disabledSteps[filename].delete(stepName)
    } else {
      disabledSteps[filename].add(stepName)
    }
  }

  const getDisabledList = (filename) => [...(disabledSteps[filename] || [])]

  const fetchScripts = async () => {
    try {
      const res = await fetch('/api/scripts')
      const data = await res.json()
      scripts.value = data.scripts
      if (data.fallbackCheckinEnabled !== undefined) fallbackCheckinEnabled.value = data.fallbackCheckinEnabled
      // auto-expand active script and pre-populate disabled steps from script enabled field
      for (const s of data.scripts) {
        if (s.active && expanded[s.filename] === undefined) expanded[s.filename] = true
        // Initialize disabled steps from script-level enabled:false defaults (only on first load)
        if (!disabledSteps[s.filename]) {
          const defaultDisabled = s.steps.filter(step => !step.enabled).map(step => step.name)
          if (defaultDisabled.length) disabledSteps[s.filename] = new Set(defaultDisabled)
        }
      }
    } catch (e) {
      console.error('Failed to fetch scripts:', e)
    } finally {
      loading.value = false
    }
  }

  const deactivate = async () => {
    await fetch('/api/scripts/deactivate', { method: 'POST' })
    await fetchScripts()
  }

  const toggleFallbackCheckin = async () => {
    const enabled = !fallbackCheckinEnabled.value
    await fetch('/api/scripts/fallback-checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled })
    })
    fallbackCheckinEnabled.value = enabled
  }

  const toggleExpanded = (filename) => {
    expanded[filename] = !expanded[filename]
  }

  const activate = async (filename) => {
    await fetch(`/api/scripts/${filename}/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ disabledSteps: getDisabledList(filename), autoReset: getAutoReset(filename) })
    })
    await fetchScripts()
  }

  const reset = async (filename) => {
    await fetch(`/api/scripts/${filename}/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ disabledSteps: getDisabledList(filename), autoReset: getAutoReset(filename) })
    })
    await fetchScripts()
  }

  const sendStep = async (scriptFilename, stepName) => {
    const res = await fetch(`/api/scripts/${scriptFilename}/steps/${stepName}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    })
    const data = await res.json()
    if (data.error) {
      alert(`Send failed: ${data.error}`)
    }
  }

  const editStep = (step) => {
    const data = step.send || step.response
    if (!data) return

    // Find BrokerToDevice proto type to open as form
    const b2dProto = findProtoBy({ name: 'BrokerToDevice' })
    if (!b2dProto) {
      console.error('BrokerToDevice proto not found')
      return
    }

    messageStore.loadFromData(b2dProto, data)
  }

  onMounted(fetchScripts)
</script>

<style>
  .section-toggle {
    cursor: pointer;
    user-select: none;
  }

  .section-toggle:hover {
    opacity: 0.8;
  }

  .scripts-section {
    font-size: 0.9em;
  }

  .scripts-status {
    color: var(--text-muted);
    font-size: 0.85em;
  }

  .fallback-checkin-label {
    font-size: 0.8em;
    cursor: pointer;
    user-select: none;
    color: var(--text-muted);
    display: flex;
    align-items: center;
    gap: 0.3em;
    margin-bottom: 0.4em;
  }

  .script-item {
    margin-bottom: 0.2em;
  }

  .script-header {
    cursor: pointer;
    font-family: monospace;
    font-size: 0.85em;
    padding: 2px 0;
    display: flex;
    align-items: center;
    gap: 0.3em;
  }

  .script-header:hover {
    background: var(--bg-sidebar-hover);
  }

  .script-header .expand-icon {
    font-size: 0.7em;
    width: 1em;
    flex-shrink: 0;
  }

  .script-header .script-name {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .script-header.active .script-name {
    color: var(--accent-green);
    font-weight: bold;
  }

  .active-badge {
    font-size: 0.7em;
    padding: 0 4px;
    border-radius: 3px;
    background: var(--bg-tag-trigger);
    color: var(--color-tag-trigger);
    flex-shrink: 0;
  }

  .script-details {
    padding-left: 1.3em;
  }

  .script-desc {
    font-size: 0.8em;
    color: var(--text-muted);
    margin: 0 0 0.3em 0;
    white-space: normal !important;
  }

  .script-controls {
    margin-bottom: 0.3em;
    display: flex;
    align-items: center;
    gap: 0.3em;
    flex-wrap: wrap;
  }

  .script-controls button {
    font-size: 0.75em;
    padding: 1px 6px;
    cursor: pointer;
  }

  .auto-reset-label {
    font-size: 0.75em;
    cursor: pointer;
    user-select: none;
    color: var(--text-muted);
    display: inline-flex;
    align-items: center;
    gap: 0.2em;
  }

  .step-list {
    margin: 0;
    padding-left: 0;
    list-style: none;
  }

  .step-item {
    display: flex;
    align-items: center;
    gap: 0.3em;
    flex-wrap: wrap;
    margin-bottom: 1px;
    white-space: normal;
    overflow-x: visible;
    line-height: 1.4;
  }

  .step-name {
    font-family: monospace;
    font-size: 0.8em;
  }

  .step-name.completed {
    text-decoration: line-through;
    color: var(--text-muted);
  }

  .step-tag {
    font-size: 0.65em;
    padding: 0 3px;
    border-radius: 3px;
    font-family: monospace;
  }

  .step-tag.trigger {
    background: var(--bg-tag-trigger);
    color: var(--color-tag-trigger);
  }

  .step-tag.after {
    background: var(--bg-tag-after);
    color: var(--color-tag-after);
  }

  .step-tag.waitfor {
    background: var(--bg-tag-after);
    color: var(--color-tag-after);
  }

  .step-item input[type="checkbox"] {
    margin: 0;
    flex-shrink: 0;
    cursor: pointer;
    width: 13px;
    height: 13px;
  }

  .step-name.disabled {
    opacity: 0.4;
    text-decoration: line-through;
  }

  .delay-row {
    padding-left: 0.3em;
  }

  .delay-label {
    font-size: 0.7em;
    font-family: monospace;
    color: var(--text-muted);
  }

  .edit-btn, .send-btn {
    font-size: 0.65em;
    padding: 0 5px;
    cursor: pointer;
    border-radius: 3px;
    line-height: 1.6;
  }

  .edit-btn {
    background: var(--bg-edit-btn);
    border: 1px solid var(--color-edit-btn);
    color: var(--color-edit-btn);
  }

  .edit-btn:hover {
    background: var(--color-edit-btn);
    color: white;
  }

  .send-btn {
    background: var(--bg-send-btn);
    border: 1px solid var(--color-send-btn);
    color: var(--color-send-btn);
  }

  .send-btn:hover {
    background: var(--color-send-btn);
    color: white;
  }
</style>
