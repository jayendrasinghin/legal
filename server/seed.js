import {
  APP_DESCRIPTION_LONG,
  APP_NAME,
  APP_TAGLINE_SHORT,
} from '../appMeta.js'
import { pool } from './db.js'

// Shopify app–oriented copy for listing / hosted policy URL. Have counsel review before production.
const privacyPolicyContent = `This Privacy Policy describes how the ${APP_NAME} app (“App”), offered at https://seoi.in, collects, uses, and shares information when you install or use the App on a Shopify-powered store (“Store”).

What the App does
${APP_DESCRIPTION_LONG} ${APP_TAGLINE_SHORT} Feature availability depends on your plan, settings, and the permissions you grant in Shopify.

Who this applies to
This policy applies to merchants who install the App and to information processed in connection with that installation and use. If you are an end customer of a merchant’s Store, that merchant’s own policies govern your relationship with them; the App may process Store-related data only as described here and as permitted by Shopify and the permissions you grant.

Information we process
• Store and merchant account information made available to us through Shopify when you install the App, such as store name, contact details, and identifiers needed to operate the integration.
• Information the App accesses via the Shopify APIs according to the permissions you approve during installation (for example, products, product images, and related fields such as titles, descriptions, and alt text, depending on the scopes requested by the App).
• Content you submit for AI-powered features (for example, prompts, selected products or images, and generated outputs such as suggested descriptions or alt text), processed only to provide the features you use.
• Technical and usage data needed to run and secure the App, such as logs, diagnostics, timestamps, and approximate region derived from IP where applicable.
• Information you send us directly (for example, support emails or messages).

How we use information
We use this information to provide, maintain, and improve the App, including AI-assisted generation, scanning for missing image SEO, suggestions, and merchandising workflows; to authenticate and connect to your Store; to respond to support requests; to monitor reliability and security; and to comply with law. We do not sell your personal information.

Shopify
Your Store is hosted by Shopify. Shopify’s processing of merchant and customer data is governed by Shopify’s terms and policies. Our use of Shopify’s APIs is subject to Shopify’s API Terms and the permissions you grant when you install the App.

Service providers
We may use trusted subprocessors (for example, hosting, email, analytics, and—where you use AI features—AI inference providers) that process data only on our instructions and under appropriate safeguards.

Retention
We retain information only as long as needed to provide the App, meet legal obligations, resolve disputes, and enforce our agreements. Retention periods may vary depending on the type of data and legal requirements.

Security
We implement reasonable technical and organizational measures designed to protect information against unauthorized access, loss, or misuse. No method of transmission or storage is completely secure.

International transfers
If data is processed in countries other than your own, we take steps consistent with applicable law and our agreements with you or Shopify.

Your rights
Depending on where you live, you may have rights to access, correct, delete, or restrict certain processing of personal information, or to object or port data. To exercise these rights, contact us using the details below. You may also uninstall the App from your Store; some information may remain with Shopify according to Shopify’s policies.

Changes
We may update this policy from time to time. The “Last updated” date on this page will change when we do. Continued use of the App after changes means you accept the updated policy.

Contact
Questions about this policy or the App’s privacy practices: support.seoi.in@gmail.com`

const supportContent = `This page is for merchants using the ${APP_NAME} Shopify app.

About the app
${APP_DESCRIPTION_LONG}

One-line summary (for short listing fields)
${APP_TAGLINE_SHORT}

Getting help
• Email: support.seoi.in@gmail.com — we usually reply within one business day.
• Before writing in, note your store URL and a short description of the issue (screenshots help).

Uninstalling
You can remove the App at any time from your Shopify admin under Settings → Apps and sales channels. Uninstall stops new data access via the App according to Shopify’s processes; prior processing is described in our Privacy Policy.

Shopify
For questions about your Shopify account, billing, or core platform features, contact Shopify Support through your admin.`

const faqContent = `Frequently asked questions — ${APP_NAME} (optional listing section)

What does this app do?
${APP_DESCRIPTION_LONG}

Short description (strict / character-limited fields)
${APP_TAGLINE_SHORT}

Do I need technical skills?
No. Install the app from the Shopify App Store, open it from your admin, and follow the in-app steps. If something is unclear, email support.seoi.in@gmail.com.

What Shopify permissions does the app need?
The app requests only the API access scopes required for its features. You approve these when you install the app. You can review or revoke access in Shopify admin under Settings → Apps and sales channels.

Will the app change my theme?
The app does not replace your theme. Any storefront impact depends on how Shopify uses the image data you update (for example, alt text on product images).

Can I uninstall anytime?
Yes. Remove the app under Settings → Apps and sales channels. Uninstall stops new access through the app per Shopify’s processes.

Where is the app hosted?
The app is offered in connection with https://seoi.in.

Who do I contact for help?
Email support.seoi.in@gmail.com with your store URL and a short description of the issue (screenshots help).`

const createTableQuery = `
  CREATE TABLE IF NOT EXISTS policy_pages (
    id SERIAL PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
`

const pages = [
  {
    slug: 'privacy-policy',
    title: 'Privacy Policy (Shopify App)',
    content: privacyPolicyContent,
  },
  {
    slug: 'support',
    title: 'Support (Shopify App)',
    content: supportContent,
  },
  {
    slug: 'faq',
    title: 'FAQ (optional)',
    content: faqContent,
  },
]

async function seed() {
  try {
    await pool.query(createTableQuery)

    for (const page of pages) {
      await pool.query(
        `
        INSERT INTO policy_pages (slug, title, content, updated_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (slug)
        DO UPDATE SET
          title = EXCLUDED.title,
          content = EXCLUDED.content,
          updated_at = NOW()
        `,
        [page.slug, page.title, page.content],
      )
    }

    console.log('Database seeded successfully.')
  } catch (error) {
    console.error('Seed failed:', error)
    process.exitCode = 1
  } finally {
    await pool.end()
  }
}

seed()
