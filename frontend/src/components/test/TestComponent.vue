<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
    title: string;
    items: string[];
}>();

const emit = defineEmits<{
    (e: 'add-item', item: string): void;
}>();

const newItem = ref('');

function addNewItem() {
    if (newItem.value.trim()) {
        emit('add-item', newItem.value.trim());
        newItem.value = '';
    }
}
</script>

<template>
    <div>
        <h1>{{ title }}</h1>
        <div v-for="(item, index) in items" :key="item + '-' + index">
            {{ item }}
        </div>
        <input v-model="newItem" @keyup.enter="addNewItem" />
        <button @click="addNewItem">Add</button>
    </div>
</template>
