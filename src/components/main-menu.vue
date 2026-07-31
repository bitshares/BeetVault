<script setup>
    import { ref, computed, watch, onBeforeUnmount } from "vue";
    import { useI18n } from "vue-i18n";

    import router from "../router/index.js";
    import store from "../store/index.js";
    import { Button } from '@/components/ui/ui/button';
    import { Spinner } from '@/components/ui/ui/spinner';
    import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/ui/dropdown-menu';
    import { Menu, Home, Plus, KeyRound, Upload, Code, QrCode, PenLine, ShieldCheck, Download, Settings, Network, LogOut } from 'lucide-vue-next';
    import { useInjectedCall } from "@/composables/useInjectedCall.js";
    import { useProcessing } from "@/composables/useProcessing.js";

    const { isProcessing } = useProcessing();

    let hasActivePopup = computed(() => store.getters["PopupStore/hasActivePopup"]);

    const iconMap = {
        home: Home,
        add: Plus,
        generating_tokens: KeyRound,
        upload: Upload,
        raw_on: Code,
        qr_code_2: QrCode,
        pen_line: PenLine,
        shield_check: ShieldCheck,
        download: Download,
        settings: Settings,
        lan: Network,
        logout: LogOut,
    };

    let open = ref(false);
    let lastIndex = ref(0);
    const { t } = useI18n({ useScope: "global" });

    let consoleErrorBuffer = ref([]);
    window.addEventListener('error', (event) => {
        consoleErrorBuffer.value.push({
            message: event.message,
            source: event.filename,
            line: event.lineno,
            timestamp: new Date().toISOString()
        });
        if (consoleErrorBuffer.value.length > 20) consoleErrorBuffer.value.shift();
    });

    let items = computed(() => {
        return [
            {
                text: t("common.actionBar.Home"),
                index: 0,
                icon: "home",
                url: "/dashboard"
            },
            {
                text: t("common.actionBar.New"),
                index: 1,
                icon: "add",
                url: "/add-account"
            },
            {
                text: t("common.actionBar.TOTP"),
                index: 2,
                icon: "generating_tokens",
                url: "/totp"
            },
            {
                text: t("common.actionBar.Local"),
                index: 3,
                icon: "upload",
                url: "/local"
            },
            {
                text: t("common.actionBar.RAW"),
                index: 4,
                icon: "raw_on",
                url: "/raw-link"
            },
            {
                text: t("common.actionBar.QR"),
                index: 5,
                icon: "qr_code_2",
                url: "/qr"
            },
            {
                text: t("common.actionBar.SignMsg"),
                index: 6,
                icon: "pen_line",
                url: "/sign-message"
            },
            {
                text: t("common.actionBar.VerifyMsg"),
                index: 7,
                icon: "shield_check",
                url: "/verify-message"
            },
            {
                text: t("common.actionBar.Backup"),
                index: 8,
                icon: "download",
                url: "/backup"
            },
            {
                text: t("common.actionBar.Settings"),
                index: 9,
                icon: "settings",
                url: "/settings"
            },
            {
                text: t("common.actionBar.changeNodes"),
                index: 10,
                icon: "lan",
                url: "/nodes"
            },
            {
                text: t("common.actionBar.Logout"),
                index: 11,
                icon: "logout",
                url: "/"
            }
        ]
    });

    function onChange(data) {
        lastIndex.value = data.index;

        if (data.index === 11) {
            console.log("User logged out.");
            store.dispatch("WalletStore/logout");
            router.replace("/");
        }

        router.replace(items.value[data.index].url);
    }

    let logoutTimer = null;
    function clearLogoutTimer() {
        if (logoutTimer) {
            clearTimeout(logoutTimer);
            logoutTimer = null;
        }
    }

    onBeforeUnmount(() => {
        clearLogoutTimer();
    });

    function startLogoutTimer() {
        if (!store.state.WalletStore.isUnlocked) {
            return;
        }

        clearLogoutTimer();

        let timeoutMinutes = store.getters["SettingsStore/getLogoutTimeout"];
        if (!timeoutMinutes || timeoutMinutes <= 0) {
            return;
        }

        logoutTimer = setTimeout(() => {
            console.log("wallet timed logout");
            store.dispatch("WalletStore/logout");
            router.replace("/");
        }, timeoutMinutes * 60 * 1000);
    }

    // Blockchain request handling delegated to composable
    useInjectedCall(lastIndex, { store, consoleErrorBuffer, t, startLogoutTimer });

    watch(
        () => router.currentRoute.value,
        (newRoute) => {
            if (newRoute.path === '/') {
                clearLogoutTimer();
            }

            const matchingItem = items.value.find(
                (item) => item.url === newRoute.path
            );
            if (matchingItem) {
                lastIndex.value = matchingItem.index;
            }
        }
    );

    watch(
        () => store.state.WalletStore.isUnlocked,
        (isUnlocked) => {
            if (isUnlocked) {
                startLogoutTimer();
                window.electron.setNode((data) => {
                    const _currentChain = store.getters["AccountStore/getChain"];
                    store.dispatch("SettingsStore/setNode", {
                        chain: _currentChain,
                        node: data,
                    });
                });
                window.electron.onGetSafeAccount((arg) => {
                    let account =
                        store.getters["AccountStore/getCurrentSafeAccount"]();
                    window.electron.getSafeAccountResponse(account);
                });
            } else {
                clearLogoutTimer();
            }
        },
        { immediate: true }
    );
</script>

<template>
    <div class="relative">
        <Button
            v-if="store.state.WalletStore.isUnlocked"
            size="icon-sm"
            class="rounded-full"
            :disabled="isProcessing || hasActivePopup"
            @click="open = true"
        >
            <Spinner v-if="isProcessing || hasActivePopup" class="h-4 w-4" />
            <Menu v-else class="h-4 w-4" />
        </Button>

        <DropdownMenu :open="open" @update:open="open = $event">
            <DropdownMenuTrigger as-child>
                <span />
            </DropdownMenuTrigger>
            <DropdownMenuContent
                style="border: 1px solid #c7088e"
            >
                <DropdownMenuItem
                    v-for="item in items"
                    :key="item.icon"
                    @click="onChange(item)"
                >
                    <component
                        :is="iconMap[item.icon]"
                        class="h-4 w-4"
                        :class="lastIndex === item.index ? 'text-gray-500' : ''"
                    />
                    <span>{{ item.text }}</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    </div>
</template>
