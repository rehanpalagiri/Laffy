import { useParams } from "react-router-dom";
import { Layout } from "@/components/Layout";

type Slug =
  | "privacy-notice" | "consumer-health" | "terms" | "subscription-terms"
  | "cookie-notice" | "accessibility" | "medical-disclaimer";

const PAGES: Record<Slug, { title: string; body: string[] }> = {
  "privacy-notice": {
    title: "Privacy Policy",
    body: [
      "Laffy requires a face photo to generate an appearance-based AI skin analysis and personalized skincare box recommendations. The scan estimates visible skin-related signals such as shine, texture, visible redness, tone variation, and face-zone differences.",
      "The app stores consent choices, questionnaire answers, scan metadata, and analysis results such as scores, summaries, routine suggestions, recommended product categories, and final bundled box price. CSV exports include image references or IDs if an image is stored by a backend, not raw image data.",
      "Scan-related metadata may be used to evaluate upload quality, detect failed scans, reduce false positives, monitor whether the AI is producing reasonable outputs, and improve recommendation quality. Optional de-identified improvement use is controlled separately from the required scan consent where applicable.",
      "Authorized internal admins may review restricted scan metadata and quality-control records such as scan ID, timestamp, upload quality, face detected status, lighting, blur, detected concerns, recommendation categories, model version, error flags, and admin review status. Production admin access should require authentication, limited permissions, encrypted storage, and access logs.",
      "When browser-side processing is available, the photo is analyzed locally. If a secure backend or external AI endpoint is configured, the photo may be sent only to generate the requested scan result, perform quality checks, and maintain the service.",
      "We do not create biometric templates, perform facial recognition, identify you, or infer age, gender, ethnicity, emotion, or attractiveness.",
      "Raw photos are not stored in local CSV or JSON exports. If backend image storage is added, it should use secure storage, retention limits, restricted admin access, and reference IDs rather than embedding images in records.",
      "You may revoke face-scan consent, delete scan data, or export your data from Data Controls.",
    ],
  },
  "consumer-health": {
    title: "Consumer Health Data Privacy Notice",
    body: [
      "Laffy treats face-derived scan signals and skin-related questionnaire answers as sensitive data.",
      "This data is collected only with opt-in consent and only to generate cosmetic skincare guidance requested by the user.",
      "We do not sell this data or use it for advertising. Optional aggregate insights, if enabled, must be de-identified and must not include photos, embeddings, contact details, or individual records.",
      "You may revoke consent and delete local scan data at any time from Data Controls.",
    ],
  },
  "terms": {
    title: "Terms of Service",
    body: [
      "By using Laffy you agree to use the service for personal, non-commercial purposes and not to misuse, scrape, or attempt to reverse-engineer it.",
      "The face scan requires a photo and explicit consent. You must have permission to upload the image you submit, and you should not upload someone else's face without their consent. The resulting analysis is appearance-based skincare guidance, not a medical diagnosis.",
      "Laffy may use scan-related metadata to maintain the service, evaluate upload quality, detect invalid or non-face uploads, reduce scan errors, monitor model behavior, and improve recommendation quality. Optional improvement uses are handled through separate consent where required.",
      "If a scan does not show a clear single face, is too blurry, has poor lighting, or is otherwise unsuitable for analysis, Laffy may decline to produce a normal report and ask you to retake or re-upload the scan.",
      "Laffy is not a medical device, medical service, dermatologist, or substitute for professional advice. It does not diagnose, treat, cure, or prevent disease.",
      "For painful, sudden, severe, bleeding, spreading, or persistent skin concerns, contact a licensed professional.",
      "Always read product labels, follow manufacturer instructions, and patch-test new products.",
      "Optional product bundles and any future recurring delivery are governed by the Bundle Terms.",
    ],
  },
  "subscription-terms": {
    title: "Bundle Terms",
    body: [
      "If Laffy offers a product bundle, the checkout page must show the final bundled box price, applicable taxes, shipping charges, and the total before purchase.",
      "A bundle recommendation is optional. The AI skin report remains available without purchasing products.",
      "If recurring delivery is added later, renewal date, cadence, cancellation controls, and total price must be shown before billing.",
      "Refund eligibility, shipping details, and product substitutions must be shown before checkout where applicable.",
      "We do not use countdowns, dark patterns, or hidden recurring-charge language.",
    ],
  },
  "cookie-notice": {
    title: "Cookie Notice",
    body: [
      "Laffy uses necessary local storage to remember consent choices, scan flow progress, questionnaire answers, and local scan results when scan history is enabled.",
      "The current app does not require optional marketing cookies. Analytics or marketing cookies should remain optional if added in the future.",
      "Cookies and local storage never authorize face-photo processing. Camera and photo upload require a separate, explicit consent checkbox.",
      "Necessary storage may be required for scan/session functionality and data controls.",
    ],
  },
  "accessibility": {
    title: "Accessibility Statement",
    body: [
      "Laffy is designed for accessible contrast, visible keyboard focus states, semantic HTML, screen-reader-friendly labels, and reduced-motion support.",
      "We aim to conform with WCAG 2.2 AA. Independent accessibility audits are part of our pre-launch checklist.",
      "If you experience an accessibility issue, please contact us so we can address it.",
    ],
  },
  "medical-disclaimer": {
    title: "Medical Disclaimer",
    body: [
      "Laffy provides cosmetic skincare guidance only. It does not diagnose, treat, or prevent acne, rosacea, eczema, psoriasis, skin cancer, infection, or any other medical condition.",
      "Information here is not a substitute for professional medical advice. Please consult a licensed clinician for painful, sudden, severe, bleeding, or persistent skin concerns.",
      "Always read product labels, follow manufacturer instructions, and patch-test new products before regular use.",
    ],
  },
};

export default function Legal() {
  const { slug } = useParams<{ slug: Slug }>();
  const page = slug && PAGES[slug];
  if (!page) {
    return <Layout><section className="container-prose py-20"><h1 className="font-display text-3xl">Not found</h1></section></Layout>;
  }
  return (
    <Layout>
      <section className="container-prose py-16">
        <div className="text-eyebrow">Legal</div>
        <h1 className="font-display text-4xl mt-2">{page.title}</h1>
        <div className="mt-6 prose prose-neutral max-w-none">
          {page.body.map((p) => <p key={p}>{p}</p>)}
        </div>
      </section>
    </Layout>
  );
}
