<template>
  <label class="label">
    <p>{{ oneof.name }}:</p>

    <select>
      <option v-for="field in oneof.oneof" :id="field.type">
        {{ field.fieldName }} ({{ field.type?.split('.').at(-1) }})
      </option>
    </select>
  </label>
</template>

<script setup>
  defineProps(["oneof"])
</script>
