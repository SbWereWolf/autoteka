# Frontend standard

## Stack

- Vue 3.5+ Composition API
- Vite 5+
- Tailwind CSS 4.2+
- HTML5
- CSS custom properties

## Base rule

Frontend is built in this order:

1. semantic HTML;
2. accessibility;
3. state and behavior;
4. visual layer.

## Components

A component should have one clear role: rendering plus local UI behavior.

Do not mix inside one random component:

- data fetching;
- data normalization;
- DOM mutation through selectors;
- unrelated business rules.

### How to do it

```vue
<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ disabled?: boolean }>()
const classes = computed(() => [
  'inline-flex items-center rounded-md px-4 py-2',
  props.disabled && 'opacity-50',
])
</script>

<template>
  <button type="button" :class="classes" :disabled="disabled">
    <slot />
  </button>
</template>
```

### How not to do it

```vue
<script>
export default {
  methods: {
    async save() {
      const res = await fetch('/api/v1/shop/' + this.id)
      document.querySelector('.title').style.color = 'red'
      this.$emit('done', await res.json())
    },
  },
}
</script>
```

The bad example mixes network, DOM mutation, and UI event handling in one place.

## State and API

Use same-origin API access through `VITE_API_BASE_URL`, default `/api/v1`.

If shared state is reused across screens, move it out of a random page component.

## Styling

- Tailwind is the main styling mechanism.
- CSS variables are the source for theme/design tokens.
- Do not introduce ad-hoc styling systems.

## Testing

For a frontend change, add or update the smallest relevant test:

- component/unit test for local UI behavior;
- API integration test for client/backend contract;
- e2e only when the user flow truly requires browser integration.
