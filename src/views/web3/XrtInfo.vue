<template>
  <div>
    <div>balance: {{ $filters.balance(balance, 9, "XRT") }}</div>
  </div>
</template>

<script>
import xrt_abi from "./abi/XRT.json";
import { $web3 } from "@/plugins/web3";
import { ethers } from "ethers";
import { ref, watch } from "vue";
import { address } from "./config";

export default {
  setup() {
    const balance = ref(null);

    // XRT
    const xrtContract = new ethers.Contract(
      address.xrt,
      xrt_abi,
      $web3.provider
    );

    (async () => {
      try {
        balance.value = await xrtContract.balanceOf($web3.state.account);
      } catch (error) {
        console.log(error);
      }
    })();

    watch(
      () => $web3.state.block,
      async () => {
        try {
          balance.value = await xrtContract.balanceOf($web3.state.account);
        } catch (error) {
          console.log(error);
        }
      }
    );

    return {
      balance
    };
  }
};
</script>
