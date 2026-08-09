import { createRouter, createWebHashHistory } from 'vue-router'

import HeaderGuest from "../components/header-guest.vue";
import HeaderSmall from "../components/header-small.vue";
import Start from "../components/start.vue";
import Dashboard from "../components/dashboard.vue";
import Restore from "../components/restore.vue";
import AddAccount from "../components/add-account.vue";
import Backup from "../components/backup.vue";
import Totp from "../components/totp.vue";
import RawLink from "../components/raw-link.vue";
import SignMessage from "../components/sign-message.vue";
import VerifyMessage from "../components/verify-message.vue";

import Qr from "../components/qr.vue";
import Popups from "../components/popups.vue";
import Receipt from "../components/receipt.vue";
import Local from "../components/local.vue";
import Settings from "../components/settings.vue";
import Nodes from "../components/nodes.vue";

const router = createRouter({
  routes: [{
      path: '/',
      components: {
        default: Start,
        header: HeaderGuest
      }
    },
    {
      path: '/backup',
      components: {
        default: Backup,
        header: HeaderSmall
      }
    },
    {
      path: '/local',
      components: {
        default: Local,
        header: HeaderSmall
      }
    },
    {
      path: '/totp',
      components: {
        default: Totp,
        header: HeaderSmall
      }
    },
    {
        path: '/raw-link',
        components: {
            default: RawLink,
            header: HeaderSmall
        }
    },
    {
        path: '/sign-message',
        components: {
            default: SignMessage,
            header: HeaderSmall
        }
    },
    {
        path: '/verify-message',
        components: {
            default: VerifyMessage,
            header: HeaderSmall
        }
    },
    {
        path: '/qr',
      components: {
        default: Qr,
        header: HeaderSmall
      }
    },
    {
      path: '/restore',
      components: {
        default: Restore,
        header: HeaderSmall
      }
    },
    {
      path: '/create',
      components: {
        default: AddAccount,
        header: HeaderSmall
      }
    },
    {
      path: '/add-account',
      components: {
        default: AddAccount,
        header: HeaderSmall
      }
    },
    {
      path: '/dashboard',
      components: {
        default: Dashboard,
        header: HeaderSmall
      }
    },
    {
        path: '/settings',
        components: {
            default: Settings,
            header: HeaderSmall
        }
    },
    {
        path: '/nodes',
        components: {
            default: Nodes,
            header: HeaderSmall
        }
    },
    {
      path: '/modal',
      components: {
        default: Popups,
        header: HeaderSmall
      }
    },
    {
        path: '/receipt',
        components: {
            default: Receipt,
            header: HeaderSmall
        }
    }
  ],
  history: createWebHashHistory()
});
export default router;
