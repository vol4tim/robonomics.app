<template>
  <div v-if="$web3.state.isReady">
    <h2>Network Info</h2>
    <div>networkId: {{ $web3.state.networkId }}</div>
    <div>blockNumber: {{ $web3.state.block?.number }}</div>
  </div>
</template>

<script>
import { $web3 } from "@/plugins/web3";

export default {
  setup() {
    return {
      $web3
    };
  }
};
</script>
