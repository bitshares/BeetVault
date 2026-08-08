<script setup>
import { ref, computed, onMounted, inject } from 'vue';
import { useI18n } from 'vue-i18n';
import queryString from 'query-string';
import {
    BookOpen, Clock, Code, Code2, ScanLine, FileJson, PenLine, ShieldCheck,
    Zap, Shield, Wrench, HelpCircle, Blocks,
    ChevronRight, Loader2
} from 'lucide-vue-next';
import { Button } from '@/components/ui/ui/button';
import { ScrollArea } from '@/components/ui/ui/scroll-area';
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarProvider,
    SidebarTrigger,
} from '@/components/ui/ui/sidebar';

import MarkdownRenderer from './markdown-renderer.vue';
import { selectLocales } from '../config/i18n.js';

const { t } = useI18n({ useScope: 'global' });
const emitter = inject('emitter');

const params = queryString.parse(window.location.search);
const currentPage = ref(params.page || 'index');
const currentLocale = ref('en');
const manifest = ref(null);
const pageContent = ref('');
const isLoading = ref(true);
const error = ref(null);

const iconMap = {
    BookOpen,
    Clock,
    Code,
    Code2,
    ScanLine,
    FileJson,
    PenLine,
    ShieldCheck,
    Zap,
    Shield,
    Wrench,
    HelpCircle,
    Blocks,
};

/**
 * Every section, at any nesting depth, as a flat lookup list.
 * Used for page resolution and for mapping markdown links back to sections.
 */
const allSections = computed(() => {
    if (!manifest.value) return [];
    const flatten = (sections) =>
        sections.flatMap(section => [section, ...flatten(section.items || [])]);
    return flatten(manifest.value.sections);
});

const currentSection = computed(
    () => allSections.value.find(s => s.id === currentPage.value) || null
);

const localizedSections = computed(() => {
    if (!manifest.value) return [];
    const localize = (section) => ({
        ...section,
        title: t(`common.${section.titleKey}`),
        items: (section.items || []).map(localize),
    });
    return manifest.value.sections.map(localize);
});

async function loadManifest() {
    manifest.value = await window.electron.readManifest();
}

async function loadPage(pageId, locale) {
    isLoading.value = true;
    error.value = null;

    const section = allSections.value.find(s => s.id === pageId);
    if (!section) {
        error.value = t('common.docs.error');
        isLoading.value = false;
        return;
    }

    try {
        pageContent.value = await window.electron.readDoc({
            locale,
            path: section.path
        });
    } catch (err) {
        console.error(err);
        error.value = t('common.docs.error');
    } finally {
        isLoading.value = false;
    }
}

function onNavigate(sectionId) {
    if (sectionId === currentPage.value) return;

    // Selecting a group that shares its path with a child (a chain and its
    // overview, for example) should land on the child, so the sidebar
    // expands and highlights the page actually being shown.
    const section = allSections.value.find(s => s.id === sectionId);
    const firstChild = section?.items?.[0];
    const resolvedId =
        firstChild && firstChild.path === section.path ? firstChild.id : sectionId;

    if (resolvedId === currentPage.value) return;

    currentPage.value = resolvedId;
    loadPage(resolvedId, currentLocale.value);
}

/**
 * Handles in-document links emitted by the markdown renderer.
 * Receives a path without extension (e.g. `chains/bitshares`) and resolves
 * it to the owning manifest section.
 */
function onDocumentLink(relativePath) {
    const wanted = `${relativePath}.md`;
    const matches = allSections.value.filter(s => s.path === wanted);

    if (!matches.length) {
        console.warn(`[docs] No manifest section for link: ${wanted}`);
        return;
    }

    // A parent may share its path with its first child; prefer the leaf so the
    // sidebar highlights the specific page rather than the group.
    const target = matches.find(s => !s.items || !s.items.length) || matches[0];

    onNavigate(target.id);
}

/** True when a section or any of its descendants is the active page. */
function isGroupActive(section) {
    if (section.id === currentPage.value) return true;
    return (section.items || []).some(isGroupActive);
}

function onLocaleChange(localeValue) {
    currentLocale.value = localeValue;
    loadPage(currentPage.value, localeValue);
}

onMounted(async () => {
    await loadManifest();
    await loadPage(currentPage.value, currentLocale.value);
});
</script>

<template>
    <SidebarProvider>
        <div class="flex h-screen w-full overflow-hidden">
            <!-- Sidebar -->
            <Sidebar class="border-r border-border w-64 shrink-0">
                <SidebarHeader class="p-4 border-b border-border">
                    <!-- Language Selector -->
                    <div class="space-y-1">
                        <label class="text-xs text-muted-foreground font-medium">
                            {{ t('common.popup.language') }}
                        </label>
                        <select
                            :value="currentLocale"
                            @change="onLocaleChange(($event.target).value)"
                            class="w-full text-sm bg-background border border-border rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option
                                v-for="locale in selectLocales"
                                :key="locale.value"
                                :value="locale.value"
                            >
                                {{ locale.label }}
                            </option>
                        </select>
                    </div>
                </SidebarHeader>

                <SidebarContent class="p-2">
                    <SidebarMenu>
                        <SidebarMenuItem
                            v-for="section in localizedSections"
                            :key="section.id"
                        >
                            <SidebarMenuButton
                                :class="currentPage === section.id
                                    ? 'bg-primary/10 text-primary font-medium'
                                    : 'hover:bg-muted'"
                                @click="onNavigate(section.id)"
                                class="w-full justify-start gap-2 cursor-pointer"
                            >
                                <component
                                    :is="iconMap[section.icon] || HelpCircle"
                                    class="h-4 w-4 shrink-0"
                                />
                                <span class="truncate">{{ section.title }}</span>
                            </SidebarMenuButton>

                            <SidebarMenuSub
                                v-if="section.items && section.items.length && isGroupActive(section)"
                            >
                                <SidebarMenuSubItem
                                    v-for="item in section.items"
                                    :key="item.id"
                                >
                                    <SidebarMenuSubButton
                                        :class="currentPage === item.id
                                            ? 'bg-primary/10 text-primary font-medium'
                                            : 'hover:bg-muted'"
                                        @click="onNavigate(item.id)"
                                        class="w-full justify-start cursor-pointer"
                                    >
                                        <span class="truncate">{{ item.title }}</span>
                                    </SidebarMenuSubButton>

                                    <SidebarMenuSub
                                        v-if="item.items && item.items.length && isGroupActive(item)"
                                        class="mr-0 pr-0"
                                    >
                                        <SidebarMenuSubItem
                                            v-for="child in item.items"
                                            :key="child.id"
                                        >
                                            <SidebarMenuSubButton
                                                :class="currentPage === child.id
                                                    ? 'bg-primary/10 text-primary font-medium'
                                                    : 'hover:bg-muted'"
                                                @click="onNavigate(child.id)"
                                                class="w-full justify-start cursor-pointer text-xs"
                                            >
                                                <span class="truncate">{{ child.title }}</span>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    </SidebarMenuSub>
                                </SidebarMenuSubItem>
                            </SidebarMenuSub>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarContent>
            </Sidebar>

            <!-- Content Area -->
            <main class="flex-1 overflow-y-auto">
                <div class="max-w-3xl mx-auto p-8">
                    <!-- Loading State -->
                    <div v-if="isLoading" class="flex items-center justify-center py-20">
                        <Loader2 class="h-8 w-8 animate-spin text-primary" />
                        <span class="ml-3 text-muted-foreground">{{ t('common.docs.loading') }}</span>
                    </div>

                    <!-- Error State -->
                    <div v-else-if="error" class="py-20 text-center">
                        <div class="text-destructive text-lg font-medium">{{ error }}</div>
                        <Button
                            variant="outline"
                            size="sm"
                            class="mt-4"
                            @click="loadPage(currentPage, currentLocale)"
                        >
                            {{ t('common.popup.retry', 'Retry') }}
                        </Button>
                    </div>

                    <!-- Content -->
                    <div v-else>
                        <MarkdownRenderer
                            :content="pageContent"
                            :current-path="currentSection ? currentSection.path : ''"
                            @navigate="onDocumentLink"
                        />
                    </div>
                </div>
            </main>
        </div>
    </SidebarProvider>
</template>
