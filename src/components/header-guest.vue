<script setup>
    import { useI18n } from 'vue-i18n';
    import langSelect from "./lang-select.vue";
    const { t } = useI18n({ useScope: 'global' });
</script>

<template>
    <div class="top">
        <div class="grid grid-cols-12 container-fluid">
            <div
                class="col-span-12 largeHeader"
            >
                <div class="absolute top-3 right-3">
                    <langSelect location="guest" />
                </div>
                <div class="flex flex-col items-center">
                    <img
                        src="img/beet.png"
                        alt
                        width="150"
                        height="150"
                    >
                    <div class="beet-typo">
                        BeetEOS
                    </div>
                    <h3 class="h3">
                        {{ t("common.welcome" ) }}
                    </h3>
                </div>
            </div>
        </div>
    </div>
</template>
