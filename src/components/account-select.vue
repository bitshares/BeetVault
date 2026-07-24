<script setup>
    import { watch, ref, computed } from "vue";
    import { useI18n } from 'vue-i18n';

    import store from '../store/index.js';
    import {formatChain, formatAccount} from "../lib/formatter.js";
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/ui/select';
    const { t } = useI18n({ useScope: 'global' });

    let chosenAccount = ref(store.getters["AccountStore/getCurrentIndex"]);
    let selectedAccount = ref();

    /*
     * Retrieve the list of accounts for allocation to prop
     */
    let accounts = computed(() => {
        let accountList;
        try {
            accountList = store.getters['AccountStore/getSafeAccountList']();
        } catch (error) {
            console.log(error);
            return [];
        }
        return accountList;
    });

    /*
     * Creating the select items
     * @returns {Array}
     */
    let accountOptions = computed(() => {
        if (!accounts.value || !accounts.value || !accounts.value.length) {
            return [];
        }

        let options = accounts.value.map((account, i) => {
            return {
                label: !account.accountID && account.trackId == 0
                    ? 'cta' // TODO: Replace
                    : `${formatChain(account.chain)}: ${formatAccount(account)}`,
                value: i
            };
        });

        return options;
    });

    /*
     * User selected from the account drop down menu
     */
    watch(chosenAccount, async (newVal, oldVal) => {
        if (newVal !== -1) {
            window.electron.resetTimer();
            selectedAccount.value = accounts.value[newVal];
            store.dispatch(
                "AccountStore/selectAccount",
                {
                    chain: accounts.value[newVal].chain,
                    accountID: accounts.value[newVal].accountID
                        ? accounts.value[newVal].accountID
                        : accounts.value[newVal].accountName
                }
            );
        }
    }, {immediate: true});
</script>

<template>
    <div class="w-full px-2 py-2">
        <Select
            v-if="accountOptions.length"
            id="account_select"
            v-model="chosenAccount"
            required
        >
            <SelectTrigger class="w-full">
                <SelectValue :placeholder="t('common.account')" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem
                    v-for="option in accountOptions"
                    :key="option.value"
                    :value="option.value"
                >
                    {{ option.label }}
                </SelectItem>
            </SelectContent>
        </Select>
    </div>
</template>
