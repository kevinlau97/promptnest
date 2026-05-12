import { ref } from 'vue'

let nextId = 0
const stack = ref<number[]>([])

export function useModalStack() {
  const id = ++nextId

  function register() {
    if (!stack.value.includes(id)) {
      stack.value.push(id)
    }
  }

  function unregister() {
    const idx = stack.value.indexOf(id)
    if (idx > -1) {
      stack.value.splice(idx, 1)
    }
  }

  function isTop() {
    return stack.value[stack.value.length - 1] === id
  }

  return { id, register, unregister, isTop, stack }
}

export function isAnyModalOpen() {
  return stack.value.length > 0
}
