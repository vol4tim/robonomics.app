<template>
  <div>
    <h2>Approve XRT</h2>
    <form @submit.prevent>
      <div class="input">
        <label for="amount">amount</label>
        <input v-model="amount" id="amount" />
      </div>
      <div class="input">
        <label for="to">to</label>
        <input v-model="to" id="to" />
      </div>
      <btn-send @click="send">Send</btn-send>
    </form>
    <div v-if="allowance !== null">
      current approve: {{ $filters.balance(allowance, 9, "XRT") }}
    </div>
  </div>
</template>

<script>
import { $web3 } from "@/plugins/web3";
import { toUnit } from "@/utils/tools";
import { ethers } from "ethers";
import { ref, watch } from "vue";
import xrt_abi from "./abi/XRT.json";
import BtnSend from "./BtnSend.vue";
import { address } from "./config";

export default {
  components: { BtnSend },
  setup() {
    const amount = ref(1);
    const to = ref("");
    const allowance = ref(null);

    const xrtContract = new ethers.Contract(
      address.xrt,
      xrt_abi,
      $web3.provider
    );

    watch(
      () => $web3.state.block,
      async () => {
        try {
          if (to.value) {
            allowance.value = await xrtContract.allowance(
              $web3.state.account,
              to.value
            );
          }
        } catch (error) {
          console.log(error);
        }
      }
    );

    const send = async (wait) => {
      try {
        const tx = await xrtContract
          .connect($web3.signer)
          .approve(to.value, toUnit(amount.value, 9));
        await wait(tx);
      } catch (error) {
        if (error.code === "CALL_EXCEPTION" && error.data) {
          await wait(null, xrtContract.interface.parseError(error.data).name);
        } else {
          await wait(null, error);
        }
      }
    };

    return {
      amount,
      to,
      allowance,
      send
    };
  }
};
</script>
