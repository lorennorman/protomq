<template>
  <label class="label">
    <p>{{ primitive.name }}:</p>

    <input :type="inputType(primitive.type)"/>
  </label>
</template>

<script setup>
  const props = defineProps(["primitive"])

  const inputType = type => {
    switch(type) {
      case "int32":
      case "uint32":
      case "float":
        return "number"
      case "bool":
        return "checkbox"
      default:
        return "text"
    }
  }
</script>
