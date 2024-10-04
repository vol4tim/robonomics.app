<template>
  <div>
    <h2>Transfer XRT</h2>
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
  </div>
</template>

<script>
import { $web3 } from "@/plugins/web3";
import { toUnit } from "@/utils/tools";
import { ethers } from "ethers";
import { ref } from "vue";
import xrt_abi from "./abi/XRT.json";
import BtnSend from "./BtnSend.vue";
import { address } from "./config";

export default {
  components: { BtnSend },
  setup() {
    const amount = ref(1);
    const to = ref("");

    const xrtContract = new ethers.Contract(
      address.xrt,
      xrt_abi,
      $web3.provider
    );

    const send = async (wait) => {
      try {
        const tx = await xrtContract
          .connect($web3.signer)
          .transfer(to.value, toUnit(amount.value, 9));
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
      send
    };
  }
};
</script>
