<script setup>
    import MainMenu from "./main-menu.vue";
    import langSelect from "./lang-select.vue";
</script>

<template>
    <div class="top">
        <div class="relative flex items-center justify-center px-3 py-2">
            <div class="absolute left-3 top-2">
                <MainMenu />
            </div>
            <div class="absolute right-3 top-2">
                <langSelect location="small" />
            </div>
            <div class="flex flex-col items-center">
                <h4 class="h4 beet-typo-small">
                    BeetEOS
                </h4>
            </div>
        </div>
    </div>
</template>
