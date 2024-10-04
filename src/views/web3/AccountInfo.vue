<template>
  <div v-if="$web3.state.isReady">
    <h2>Account</h2>
    <div v-if="$web3.state.account">
      <div>account: {{ $web3.state.account }}</div>
      <div>balance: {{ $filters.balance(balance, 18, "ETH") }}</div>
    </div>
    <div v-else>
      <button @click="$web3.initAccount()">Connect ethereum account</button>
    </div>
  </div>
</template>

<script>
import { $web3 } from "@/plugins/web3";
import { ref, watch } from "vue";

export default {
  setup() {
    const balance = ref(null);

    (async () => {
      try {
        if ($web3.state.account) {
          balance.value = await $web3.provider.getBalance($web3.state.account);
        }
      } catch (error) {
        console.log(error);
      }
    })();

    watch(
      () => $web3.state.block,
      async () => {
        try {
          if ($web3.state.account) {
            balance.value = await $web3.provider.getBalance(
              $web3.state.account
            );
          }
        } catch (error) {
          console.log(error);
        }
      }
    );

    return {
      balance,
      $web3
    };
  }
};
</script>
