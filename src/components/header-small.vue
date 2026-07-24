<script setup>
    import { useRouter } from 'vue-router';
    import MainMenu from "./main-menu.vue";
    import langSelect from "./lang-select.vue";

    const router = useRouter();
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
            <div
                class="flex flex-col items-center cursor-pointer"
                @click="router.push('/dashboard')"
            >
                <h4 class="h4 beet-typo-small font-extrabold">
                    BeetEOS
                </h4>
            </div>
        </div>
    </div>
</template>
