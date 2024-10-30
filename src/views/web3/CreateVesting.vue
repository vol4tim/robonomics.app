<template>
  <div>
    <h2>Create Vesting</h2>
    <btn-send @click="send">Send</btn-send>
  </div>
</template>

<script>
import { $web3 } from "@/plugins/web3";
import { ethers } from "ethers";
import tokenVesting_abi from "./abi/TokenVesting.json";
import xrt_abi from "./abi/XRT.json";
import BtnSend from "./BtnSend.vue";
import { address } from "./config";

export default {
  components: { BtnSend },
  setup() {
    const xrtContract = new ethers.Contract(
      address.xrt,
      xrt_abi,
      $web3.provider
    );

    const tokenVestingContract = new ethers.Contract(
      address.tokenVesting,
      tokenVesting_abi,
      $web3.provider
    );

    const approve = async (wait) => {
      const amount = await tokenVestingContract.getAmount();
      try {
        const allowance = await xrtContract.allowance(
          $web3.state.account,
          address.tokenVesting
        );

        if (allowance >= amount) {
          return true;
        }

        const tx = await xrtContract
          .connect($web3.signer)
          .approve(address.tokenVesting, amount);
        await wait(tx, null, false);
      } catch (error) {
        if (error.code === "CALL_EXCEPTION" && error.data) {
          throw new Error(xrtContract.interface.parseError(error.data).name);
        }
        throw error;
      }
    };
    const createVesting = async (wait) => {
      try {
        const tx = await tokenVestingContract
          .connect($web3.signer)
          .createVestingSchedule();
        await wait(tx);
      } catch (error) {
        if (error.code === "CALL_EXCEPTION" && error.data) {
          throw new Error(
            tokenVestingContract.interface.parseError(error.data).name
          );
        }
        throw error;
      }
    };

    const send = async (wait) => {
      try {
        await approve(wait);
        await createVesting(wait);
      } catch (error) {
        await wait(null, error);
      }
    };

    return {
      send
    };
  }
};
</script>
