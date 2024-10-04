<template>
  <div>
    <div>count: {{ count }}</div>
    <div>amount: {{ $filters.balance(amount, 9, "XRT") }}</div>
    <div>duration: {{ duration }} sec</div>

    <div class="container">
      <div v-for="(ves, index) in vestingSchedules" :key="index" class="card">
        <vesting-schedule :schedule="ves" />
      </div>
    </div>
  </div>
</template>

<script>
import { $web3 } from "@/plugins/web3";
import { ethers } from "ethers";
import { ref, watch } from "vue";
import VestingSchedule from "./VestingSchedule.vue";
import tokenVesting_abi from "./abi/TokenVesting.json";
import { address } from "./config";

export default {
  components: { VestingSchedule },
  setup() {
    const count = ref(null);
    const amount = ref(null);
    const duration = ref(null);
    const vestingSchedules = ref([]);

    // Vesting
    const tokenVestingContract = new ethers.Contract(
      address.tokenVesting,
      tokenVesting_abi,
      $web3.provider
    );

    (async () => {
      try {
        amount.value = await tokenVestingContract.getAmount();
        duration.value = await tokenVestingContract.getDuration();

        count.value =
          await tokenVestingContract.getVestingSchedulesCountByBeneficiary(
            $web3.state.account
          );
      } catch (error) {
        console.log(error);
      }
    })();

    watch(
      () => $web3.state.block,
      async () => {
        try {
          count.value =
            await tokenVestingContract.getVestingSchedulesCountByBeneficiary(
              $web3.state.account
            );
        } catch (error) {
          console.log(error);
        }
      }
    );

    watch(count, async (count) => {
      if (count <= 0) {
        return;
      }
      try {
        const vestingSchedule = [];
        for (let index = 0; index < count; index++) {
          const scheduleRaw =
            await tokenVestingContract.getVestingScheduleByAddressAndIndex(
              $web3.state.account,
              index
            );

          const scheduleId =
            await tokenVestingContract.computeVestingScheduleIdForAddressAndIndex(
              $web3.state.account,
              index
            );

          vestingSchedule.push({
            id: scheduleId,
            beneficiary: scheduleRaw[0],
            cliff: Number(scheduleRaw[1]),
            start: Number(scheduleRaw[2]),
            duration: Number(scheduleRaw[3]),
            slicePeriodSeconds: Number(scheduleRaw[4]),
            revocable: scheduleRaw[5],
            amountTotal: Number(scheduleRaw[6]),
            released: Number(scheduleRaw[7]),
            revoked: scheduleRaw[8]
          });
        }
        vestingSchedules.value = vestingSchedule;
      } catch (error) {
        console.log(error);
      }
    });

    return {
      amount,
      duration,
      count,
      vestingSchedules
    };
  }
};
</script>

<style scoped>
.container {
  display: flex;
}
.card {
  border: 1px solid black;
  padding: 10px;
  margin: 10px;
}
</style>
