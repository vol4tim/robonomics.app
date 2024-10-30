<template>
  <div>
    <div>start: {{ start }}</div>
    <div>end: {{ end }}</div>
    <div>
      amountTotal: {{ $filters.balance(schedule.amountTotal, 9, "XRT") }}
    </div>
    <div>released: {{ $filters.balance(schedule.released, 9, "XRT") }}</div>
    <div>
      releasable: {{ $filters.balance(computeReleasableAmount, 9, "XRT") }}
    </div>
    <btn-send v-if="canRelease" @click="(wait) => release(wait, schedule.id)">
      Release
    </btn-send>
  </div>
</template>

<script>
import { $web3 } from "@/plugins/web3";
import { ethers } from "ethers";
import { computed, ref, watch } from "vue";
import tokenVesting_abi from "./abi/TokenVesting.json";
import BtnSend from "./BtnSend.vue";
import { address } from "./config";

export default {
  props: {
    schedule: Object
  },
  components: { BtnSend },
  setup(props) {
    const timestamp = ref(0);

    watch(
      () => $web3.state.block,
      (v) => {
        if (v) {
          timestamp.value = v.timestamp;
        }
      },
      { immediate: true }
    );

    const start = computed(() => {
      return new Date(props.schedule.cliff * 1000).toLocaleString();
    });
    const end = computed(() => {
      return new Date(
        (Number(props.schedule.start) + Number(props.schedule.duration)) * 1000
      ).toLocaleString();
    });
    const canRelease = computed(() => {
      return (
        props.schedule.released < props.schedule.amountTotal &&
        computeReleasableAmount.value > 0
      );
    });
    const computeReleasableAmount = computed(() => {
      // const currentTime = this.getCurrentTime();
      const currentTime = timestamp.value;
      if (currentTime < props.schedule.cliff || props.schedule.revoked) {
        // если текущее время меньше чем начало+клиф или отмененый грант
        return 0;
      } else if (
        currentTime >=
        props.schedule.cliff + props.schedule.duration
      ) {
        // Если текущее время уже истекло, все токены могут быть выпущены за вычетом уже выпущенной суммы.
        return props.schedule.amountTotal - props.schedule.released;
      } else {
        // Иначе некоторые токены могут быть выпущены.
        const timeFromStart = currentTime - props.schedule.cliff;
        const secondsPerSlice = props.schedule.slicePeriodSeconds;
        const vestedSlicePeriods = timeFromStart / secondsPerSlice;
        const vestedSeconds = vestedSlicePeriods * secondsPerSlice;
        const vestedAmount = parseInt(
          (props.schedule.amountTotal * vestedSeconds) / props.schedule.duration
        );
        return vestedAmount - props.schedule.released;
      }
    });

    const release = async (wait, id) => {
      const tokenVestingContract = new ethers.Contract(
        address.tokenVesting,
        tokenVesting_abi,
        $web3.provider
      );
      const amount = await tokenVestingContract.computeReleasableAmount(id);
      if (amount > 0) {
        try {
          const tx = await tokenVestingContract
            .connect($web3.signer)
            .release(id, amount);
          await wait(tx);
        } catch (error) {
          if (error.code === "CALL_EXCEPTION" && error.data) {
            await wait(
              null,
              tokenVestingContract.interface.parseError(error.data).name
            );
          } else {
            await wait(null, error);
          }
        }
      } else {
        await wait(null, null);
      }
    };

    return {
      start,
      end,
      computeReleasableAmount,
      canRelease,
      release
    };
  }
};
</script>
