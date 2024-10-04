<template>
  <div class="web3">
    <div v-if="$web3.state.isReady">
      <network-info />
      <account-info />

      <div v-if="$web3.state.account">
        <div>
          <h2>XRT</h2>
          <xrt-info />
          <transfer-xrt />
          <approve-xrt />
        </div>
        <hr />
        <div>
          <h2>NFT</h2>
          <nft-info />
          <transfer-nft />
        </div>
        <hr />
        <div>
          <h2>Vesting</h2>
          <vesting-info />
          <create-vesting />
        </div>
      </div>
    </div>
    <div v-else>...</div>
    <div v-if="$web3.state.error">
      {{ $web3.state.error }}
    </div>
  </div>
</template>

<script>
import { $web3 } from "@/plugins/web3";
import AccountInfo from "./AccountInfo.vue";
import ApproveXrt from "./ApproveXrt.vue";
import CreateVesting from "./CreateVesting.vue";
import NetworkInfo from "./NetworkInfo.vue";
import NftInfo from "./NftInfo.vue";
import TransferNft from "./TransferNft.vue";
import TransferXrt from "./TransferXrt.vue";
import VestingInfo from "./VestingInfo.vue";
import XrtInfo from "./XrtInfo.vue";

export default {
  components: {
    NetworkInfo,
    AccountInfo,
    TransferXrt,
    ApproveXrt,
    XrtInfo,
    NftInfo,
    VestingInfo,
    TransferNft,
    CreateVesting
  },
  setup() {
    (async () => {
      try {
        await $web3.init({
          networks: [11155111],
          infura: {
            networkId: 11155111,
            key: "c1ea69ab1e0a4c6aa6a9dcd0641aecc7"
          }
        });
      } catch (error) {
        console.log(error);
      }
    })();

    return {
      $web3
    };
  }
};
</script>

<style>
.web3 {
  width: 1000px;
  margin: 0 auto;
}
.web3 button {
  background-color: var(--robo-button-background);
  color: var(--robo-button-color);
  border-color: var(--robo-button-background);
  border-style: solid;
  padding: 9px 12px 10px;
  cursor: pointer;
}
.web3 button:hover {
  background-color: var(--robo-button-background-hover);
  border-color: var(--robo-button-background-hover);
}
.web3 button:disabled {
  background-color: var(--robo-color-light-80);
  border-color: var(--robo-color-light-80);
  cursor: auto;
}
.web3 input {
  padding: 10px;
  border: 1px solid black;
  background: #fff;
}

.web3 .input {
  display: block;
  margin: 5px;
  font-weight: normal;
  font-size: 14px;
}
.web3 .input input,
.web3 .input label {
  display: block;
}
.web3 form {
  display: flex;
}
.web3 form button {
  align-self: flex-end;
  margin-bottom: 5px;
}
.web3 form .error {
  align-self: flex-end;
  padding: 8px;
  color: var(--robo-color-red);
}
.web3 form .success {
  align-self: flex-end;
  padding-left: 8px;
  color: var(--robo-color-green);
  font-size: 36px;
}
</style>
