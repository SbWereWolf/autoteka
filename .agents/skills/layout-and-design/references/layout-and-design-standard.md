# Layout and design standard

## Base rule

Choose correct HTML first. Then accessibility. Then behavior. Then styling.

## Semantics

- `button` -> action
- `a` -> navigation
- `form` -> data submission
- `label` -> field label
- `table` -> tabular data only
- `header`, `nav`, `main`, `aside`, `footer`, `section` -> page structure

### How to do it

```vue
<button type="button" @click="save">Сохранить</button>
<a href="/catalog">Каталог</a>
```

### How not to do it

```vue
<div @click="save">Сохранить</div>
<a href="#" @click.prevent="save">Сохранить</a>
```

If the element performs an action, it must be a `button`. If it changes URL, it must be an `a`.

## Landmarks and headings

Use one main `main` per page and keep headings hierarchical.

### How to do it

```vue
<template>
  <header>...</header>
  <nav aria-label="Основная навигация">...</nav>
  <main>
    <h1>Редактирование магазина</h1>
    <section>
      <h2>Основные данные</h2>
    </section>
  </main>
</template>
```

### How not to do it

```vue
<template>
  <div>...</div>
  <div>...</div>
  <div>
    <div>Редактирование магазина</div>
  </div>
</template>
```

## Forms

Fields need explicit labels and errors must be associated with the field.

### How to do it

```vue
<label for="shop-name">Название магазина</label>
<input
  id="shop-name"
  v-model="form.name"
  name="name"
  type="text"
  autocomplete="organization"
  :aria-describedby="errors.name ? 'shop-name-error' : undefined"
/>
<p v-if="errors.name" id="shop-name-error">{{ errors.name }}</p>
```

### How not to do it

```vue
<input v-model="form.name" placeholder="Название магазина" />
<span v-if="errors.name">{{ errors.name }}</span>
```

Placeholder is not a label.

## Keyboard and focus

Interactive UI must be operable without a mouse. Do not remove focus outline without a real replacement. Avoid positive `tabindex`.
