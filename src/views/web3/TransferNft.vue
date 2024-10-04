<template>
  <div>
    <h2>Transfer NFT</h2>
    <form @submit.prevent>
      <div class="input">
        <label for="tokenId">tokenId</label>
        <input v-model="tokenId" id="tokenId" />
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
import { ethers } from "ethers";
import { ref } from "vue";
import nft_abi from "./abi/NFT.json";
import BtnSend from "./BtnSend.vue";
import { address } from "./config";

export default {
  components: { BtnSend },
  setup() {
    const tokenId = ref();
    const to = ref("");

    const send = async (wait) => {
      const nftContract = new ethers.Contract(
        address.nft,
        nft_abi,
        $web3.provider
      );
      try {
        console.log(1);

        const tx = await nftContract
          .connect($web3.signer)
          .transferFrom($web3.state.account, to.value, tokenId.value);
        console.log(2);

        await wait(tx);
      } catch (error) {
        if (error.code === "CALL_EXCEPTION" && error.data) {
          await wait(null, nftContract.interface.parseError(error.data).name);
        } else {
          await wait(null, error);
        }
      }
    };

    return {
      tokenId,
      to,
      send
    };
  }
};
</script>
