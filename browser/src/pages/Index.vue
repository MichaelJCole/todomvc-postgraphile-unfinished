<template>
  <q-page class="flex flex-center">
    <div>{{ hello }}</div>
  </q-page>
</template>

<script>
import gql from 'graphql-tag'

export default {
  name: 'PageIndex',
  apollo: {
    // Simple query that will update the 'hello' vue property
    hello: gql`query {
      hello
    }`
  }
}
</script>
