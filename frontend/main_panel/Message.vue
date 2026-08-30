<template>
  <div class="message-container">
    <div class="message-metadata" :title="message.topic">
      <span class="message-name">{{ prettyMessageName }}</span>
      <a class="message-resend-button" title="Resend this message?" href="#" @click="resendMessage()">&nbsp;➡️&nbsp;</a>
      <a v-if="canEdit" class="message-edit-button" title="Edit and resend this message" href="#" @click.prevent="editMessage()">&nbsp;✏️&nbsp;</a>
      <span class="message-timestamp" v-if="message.timestamp">{{ prettyTimestamp }}</span>
      <span class="message-topic">{{ prettyTopic }}</span>
    </div>

    <div class="message-payload" :title='message.message'>
      <pre>{{ prettyMessageBody }}</pre>
    </div>
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import { topicToMessageName } from '../util'
  import { useMQTTStore } from '/frontend/stores/mqtt'
  import { useMessageStore } from '/frontend/stores/message'
  import { parseMessage } from '../message_parser'
  import { findProtoBy, decodeByName } from '../protobuf_service'

  const
    props = defineProps(["message"]),
    mqttStore = useMQTTStore(),
    messageStore = useMessageStore(),
    prettyTopic = computed(() => {
      const topic = props.message.topic

      return topic.startsWith("$SYS")
        ? `$SYS/.../${topic.split('/').slice(2).join('/')}`
        : topic
    }),
    prettyMessageName = computed(() => topicToMessageName(props.message.topic)),
    prettyTimestamp = computed(() => {
      const ts = props.message.timestamp
      if (!ts) return ''
      return ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    }),
    prettyMessageBody = computed(() => parseMessage(props.message)),
    canEdit = computed(() => !!prettyMessageName.value),

    // instantly publishes this message again, to the same topic
    resendMessage = () => {
      mqttStore.publishMessage(props.message.topic, props.message.message)
    },

    // open message in the form editor for editing and resending
    editMessage = () => {
      const messageName = prettyMessageName.value
      if (!messageName) return

      const proto = findProtoBy({ name: messageName })
      if (!proto) {
        console.error(`Proto not found for: ${messageName}`)
        return
      }

      // Decode binary to protobuf object, then convert to plain JSON
      const decoded = decodeByName(messageName, props.message.message)
      if (!decoded) return

      const data = decoded.$type
        ? decoded.$type.toObject(decoded, { enums: String, defaults: false })
        : JSON.parse(JSON.stringify(decoded))

      messageStore.loadFromData(proto, data)
    }

</script>

<style>
  .message-container {
    border: 1px solid var(--border);
    border-radius: 10px;
    margin-bottom: 1em;
  }

  .message-metadata {
    background-color: var(--bg-metadata);
    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
    padding: 5px 15px;
    border-bottom: 1px solid var(--border);
  }

  .message-name {
    font-weight: 600;
  }

  .message-timestamp {
    color: var(--text-muted);
    font-size: .8em;
    margin-right: 0.5em;
  }

  .message-topic {
    color: var(--text-muted);
    font-size: .8em;
  }

  .message-payload {
    /* font-family: monospace; */
    padding: 0 15px;
  }

  .message-resend-button,
  .message-edit-button {
      text-decoration: none;
  }
</style>
