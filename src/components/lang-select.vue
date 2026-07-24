<script setup>
    import { ref, computed, inject } from 'vue';
    import { useI18n } from 'vue-i18n';
    import { defaultLocale, selectLocales } from "../config/i18n.js";
    import store from '../store/index.js';
    import { Button } from '@/components/ui/ui/button';
    import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/ui/dropdown-menu';
    import { Languages } from 'lucide-vue-next';

    const { t } = useI18n({ useScope: 'global' });
    const emitter = inject('emitter');

    const props = defineProps({
        location: {
            type: String,
            required: true,
            default() {
                return 'guest'
            }
        }
    });

    let location = computed(() => {
        return props.location;
    });

    let selected = ref(
        store.state.SettingsStore.settings.locale?.iso ?? defaultLocale.iso
    );

    let open = ref(false);

    function menuClick() {
        open.value = true;
    }

    function onSelected(locale) {
        const detectedLocale = selectLocales[locale.index].value
        emitter.emit('i18n', detectedLocale);
        store.dispatch("SettingsStore/setLocale", {locale: detectedLocale});
        selected.value = detectedLocale;
        open.value = false;
    }
</script>

<template>
    <div v-if="location === 'prompt'" class="relative">
        <DropdownMenu :open="open" @update:open="open = $event">
            <DropdownMenuTrigger as-child>
                <Button @click="menuClick">
                    <Languages class="h-4 w-4" />
                    {{ t('common.popup.language') }}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent style="border: 1px solid #C7088E; color: black;">
                <DropdownMenuItem
                    v-for="(item, index) in selectLocales"
                    :key="item.value"
                    @click="onSelected({ index })"
                >
                    {{ item.label }}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    </div>
    <div v-else class="relative">
        <DropdownMenu :open="open" @update:open="open = $event">
            <DropdownMenuTrigger as-child>
                <Button size="icon-sm" class="rounded-full" @click="menuClick">
                    <Languages class="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent style="border: 1px solid #C7088E;">
                <DropdownMenuItem
                    v-for="(locale, index) in selectLocales"
                    :key="locale.value"
                    @click="onSelected({ index })"
                >
                    {{ locale.label }}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    </div>
</template>
