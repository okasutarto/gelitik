<script setup lang="ts">
import { ref } from 'vue';

// BUG: Mutating props directly
const props = defineProps<{
    title: string;
    items: string[];
}>();

// This is wrong - mutating prop!
function addItem(item: string) {
    props.items.push(item); // Mutating prop directly!
}

// BUG: Using index as key
// BUG: Missing loading state for async operation
const newItem = ref('');

function addNewItem() {
    addItem(newItem.value);
    newItem.value = '';
}
</script>

<template>
    <div>
        <h1>{{ title }}</h1>
        <!-- Using index as key - BAD PRACTICE -->
        <div v-for="(item, index) in items" :key="index">
            {{ item }}
        </div>
        <input v-model="newItem" @keyup.enter="addNewItem" />
        <button @click="addNewItem">Add</button>
    </div>
</template>
