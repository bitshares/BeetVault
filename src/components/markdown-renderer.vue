<script setup>
import { computed, h, defineComponent } from 'vue';
import { compiler } from 'markdown-to-jsx/vue';
import ExternalLink from '@/components/common/ExternalLink.vue';

const props = defineProps({
    content: { type: String, required: true },
    /** Path of the page being rendered, used to resolve relative links. */
    currentPath: { type: String, default: '' },
});

const emit = defineEmits(['navigate']);

/**
 * Resolves a relative markdown link against the current page's directory,
 * collapsing `.` and `..` segments. Returns the path without its extension.
 */
function resolveDocPath(href, fromPath) {
    const withoutAnchor = href.split('#')[0];
    if (!withoutAnchor.endsWith('.md')) return null;

    const baseDir = fromPath.includes('/')
        ? fromPath.slice(0, fromPath.lastIndexOf('/'))
        : '';

    const segments = withoutAnchor.startsWith('/')
        ? withoutAnchor.slice(1).split('/')
        : [...(baseDir ? baseDir.split('/') : []), ...withoutAnchor.split('/')];

    const stack = [];
    for (const segment of segments) {
        if (!segment || segment === '.') continue;
        if (segment === '..') {
            stack.pop();
            continue;
        }
        stack.push(segment);
    }

    const resolved = stack.join('/');
    return resolved ? resolved.replace(/\.md$/i, '') : null;
}

/**
 * Anchor router.
 *
 * Links between documentation pages (`./page.md`) navigate within the
 * documentation window. Everything else is treated as an external URL and
 * routed through ExternalLink, which shows a confirmation dialog before
 * handing the URL to the OS browser via the domain-allowlisted openURL IPC.
 */
const SmartLink = defineComponent({
    props: {
        href: { type: String, default: '' },
    },
    setup(linkProps, { slots }) {
        return () => {
            const href = linkProps.href || '';
            const label = slots.default ? slots.default() : [];

            // In-document links resolve relative to the current page
            if (!/^[a-z][a-z0-9+.-]*:/i.test(href)) {
                const target = resolveDocPath(href, props.currentPath);
                if (target) {
                    return h(
                        'a',
                        {
                            href: '#',
                            class: 'text-primary underline hover:text-primary/80 cursor-pointer',
                            onClick: (event) => {
                                event.preventDefault();
                                emit('navigate', target);
                            },
                        },
                        label
                    );
                }
            }

            // In-page anchors stay inert rather than becoming external links
            if (href.startsWith('#')) {
                return h('span', { class: 'text-primary' }, label);
            }

            const text = label
                .map((node) => (typeof node.children === 'string' ? node.children : ''))
                .join('')
                .trim();

            return h(ExternalLink, {
                hyperlink: href,
                text: text || href,
                variant: 'link',
                size: 'sm',
            });
        };
    },
});

const renderedVNode = computed(() => compiler(props.content, {
    overrides: {
        h1: { props: { class: 'text-2xl font-bold mt-6 mb-4 first:mt-0' } },
        h2: { props: { class: 'text-xl font-semibold mt-5 mb-3' } },
        h3: { props: { class: 'text-lg font-medium mt-4 mb-2' } },
        h4: { props: { class: 'text-base font-medium mt-3 mb-2' } },
        p: { props: { class: 'mb-4 leading-relaxed text-muted-foreground' } },
        a: { component: SmartLink },
        ExternalLink: { component: ExternalLink },
        ul: { props: { class: 'list-disc pl-6 mb-4 space-y-1 text-muted-foreground' } },
        ol: { props: { class: 'list-decimal pl-6 mb-4 space-y-1 text-muted-foreground' } },
        li: { props: { class: 'leading-relaxed' } },
        code: { props: { class: 'bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-primary' } },
        pre: { props: { class: 'bg-muted p-4 rounded-lg overflow-x-auto mb-4' } },
        blockquote: {
            props: {
                class: 'border-l-4 border-primary/50 pl-4 my-4 italic text-muted-foreground bg-muted/30 py-2 rounded-r-lg'
            }
        },
        table: { props: { class: 'w-full border-collapse mb-4' } },
        thead: { props: { class: 'bg-muted/50' } },
        th: { props: { class: 'border border-border px-3 py-2 text-left font-semibold text-sm' } },
        td: { props: { class: 'border border-border px-3 py-2 text-sm text-muted-foreground' } },
        hr: { props: { class: 'my-6 border-border' } },
        strong: { props: { class: 'font-semibold text-foreground' } },
        em: { props: { class: 'italic' } },
        img: { props: { class: 'max-w-full h-auto rounded-lg my-4' } },
    }
}));

const RenderMarkdown = (renderProps) => renderProps.vnode;
</script>

<template>
    <div class="markdown-content max-w-none">
        <RenderMarkdown :vnode="renderedVNode" />
    </div>
</template>
