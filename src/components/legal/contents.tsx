import { ReactNode } from "react";

export type LegalKey = "terms" | "privacy" | "refund" | "shipping";

export const LEGAL_PAGES: Record<LegalKey, { title: string; updated: string; body: ReactNode }> = {
  terms: {
    title: "Terms of Service",
    updated: "June 2026",
    body: (
      <>
        <p>By accessing or using TRXSHOP, you agree to be bound by these Terms of Service.</p>
        <h2>Services</h2>
        <p>TRXSHOP provides access to digital products, software, subscriptions, licenses, digital content, account access products, and related services.</p>
        <p>We reserve the right to modify, suspend, discontinue, or remove products and services at any time without notice.</p>
        <h2>Accounts</h2>
        <p>Users may create an account using email registration or supported authentication providers.</p>
        <p>You are responsible for maintaining the security of your account and all activities that occur under your account.</p>
        <h2>Orders and Delivery</h2>
        <p>Products are delivered digitally.</p>
        <p>While many orders are processed quickly, delivery times may vary depending on payment verification, product availability, technical issues, or other circumstances.</p>
        <p>TRXSHOP does not guarantee delivery within a specific timeframe unless explicitly stated.</p>
        <h2>Shared Accounts and Third-Party Services</h2>
        <p>Certain products available through TRXSHOP may provide access to shared accounts, subscriptions, software, digital services, streaming services, or other third-party platforms.</p>
        <p>By purchasing such products, you acknowledge and agree that:</p>
        <ul>
          <li>Access is provided as described on the product page.</li>
          <li>Access availability and features may change without notice due to actions taken by the third-party provider.</li>
          <li>TRXSHOP is not affiliated with, endorsed by, or sponsored by any third-party company unless expressly stated.</li>
          <li>TRXSHOP is not responsible for service interruptions, account suspensions, policy changes, feature removals, regional restrictions, or actions taken by third-party providers.</li>
          <li>Customers are responsible for following all instructions provided with their purchase.</li>
          <li>Misuse of products or violation of third-party platform policies may result in loss of access.</li>
        </ul>
        <h2>Product Availability</h2>
        <p>Products may be added, removed, modified, or discontinued at any time.</p>
        <p>Availability is not guaranteed.</p>
        <h2>Prohibited Activities</h2>
        <p>Users agree not to:</p>
        <ul>
          <li>Use the Services for unlawful purposes.</li>
          <li>Attempt to interfere with website operations.</li>
          <li>Abuse refund systems.</li>
          <li>Commit payment fraud.</li>
          <li>Share, resell, or misuse products where prohibited.</li>
          <li>Attempt unauthorized access to accounts or systems.</li>
        </ul>
        <h2>Limitation of Liability</h2>
        <p>To the maximum extent permitted by applicable law, TRXSHOP shall not be liable for indirect, incidental, special, consequential, or punitive damages arising from the use of our services.</p>
        <p>TRXSHOP&apos;s maximum liability shall not exceed the amount paid by the customer for the relevant purchase.</p>
        <h2>Service Availability</h2>
        <p>TRXSHOP does not guarantee uninterrupted availability of the website or services.</p>
        <p>Temporary outages, maintenance, technical issues, or third-party service interruptions may occur.</p>
        <h2>Changes to Terms</h2>
        <p>TRXSHOP may update these Terms at any time. Continued use of the Services constitutes acceptance of any revised Terms.</p>
        <h2>Contact</h2>
        <p>Questions regarding these Terms may be directed to:</p>
        <p>Email: <a href="mailto:support@trxshop.in">support@trxshop.in</a></p>
      </>
    ),
  },
  privacy: {
    title: "Privacy Policy",
    updated: "June 2026",
    body: (
      <>
        <p>TRXSHOP ("we," "our," or "us") operates the TRXSHOP website and related services. This Privacy Policy explains how we collect, use, store, and protect your information when you visit our website, create an account, make a purchase, or otherwise interact with our services.</p>
        <p>By using TRXSHOP, you agree to the collection and use of information as described in this Privacy Policy.</p>
        <h2>Information We Collect</h2>
        <p>We may collect the following information:</p>
        <h3>Account Information</h3>
        <ul>
          <li>Email address</li>
          <li>Name (if provided)</li>
          <li>Google account information when using Google Sign-In</li>
          <li>Account preferences and settings</li>
        </ul>
        <h3>Order Information</h3>
        <ul>
          <li>Products purchased</li>
          <li>Transaction details</li>
          <li>Order history</li>
          <li>Delivery information related to digital products</li>
        </ul>
        <h3>Technical Information</h3>
        <ul>
          <li>IP address</li>
          <li>Browser type</li>
          <li>Device information</li>
          <li>Operating system</li>
          <li>Website usage data</li>
        </ul>
        <h3>Communications</h3>
        <ul>
          <li>Messages sent to customer support</li>
          <li>Emails and other communications with us</li>
        </ul>
        <h2>How We Use Your Information</h2>
        <p>We use your information to:</p>
        <ul>
          <li>Provide and maintain our services</li>
          <li>Process orders and deliver digital products</li>
          <li>Verify transactions and prevent fraud</li>
          <li>Respond to customer support requests</li>
          <li>Improve website performance and user experience</li>
          <li>Analyze website traffic and usage patterns</li>
          <li>Comply with legal obligations</li>
        </ul>
        <h2>Google Sign-In</h2>
        <p>If you choose to sign in using Google, we may receive certain information associated with your Google account, such as your email address and profile information, in accordance with Google's policies and your account settings.</p>
        <h2>Analytics</h2>
        <p>We use Google Analytics to better understand how visitors use our website. Google Analytics may collect information such as pages visited, device information, browser type, and general location data.</p>
        <p>For more information about Google Analytics, please refer to Google's Privacy Policy.</p>
        <h2>Payments</h2>
        <p>Payments are processed through third-party payment providers, including OxaPay. We do not store your payment credentials, private keys, or sensitive payment information.</p>
        <p>Payment providers may collect and process information according to their own privacy policies.</p>
        <h2>Information Sharing</h2>
        <p>We do not sell your personal information.</p>
        <p>We may share information with:</p>
        <ul>
          <li>Payment providers</li>
          <li>Hosting and infrastructure providers</li>
          <li>Analytics providers</li>
          <li>Legal authorities when required by law</li>
          <li>Service providers necessary to operate our platform</li>
        </ul>
        <h2>Data Security</h2>
        <p>We take reasonable technical and organizational measures to protect your information. However, no method of transmission or storage can be guaranteed to be completely secure.</p>
        <h2>Data Retention</h2>
        <p>We retain information only for as long as necessary to:</p>
        <ul>
          <li>Provide our services</li>
          <li>Maintain account records</li>
          <li>Comply with legal obligations</li>
          <li>Resolve disputes</li>
          <li>Enforce our policies</li>
        </ul>
        <h2>Your Rights</h2>
        <p>Depending on applicable laws, you may have rights to:</p>
        <ul>
          <li>Request access to your personal information</li>
          <li>Request correction of inaccurate information</li>
          <li>Request deletion of your information</li>
          <li>Object to certain processing activities</li>
        </ul>
        <p>To exercise these rights, contact us using the information below.</p>
        <h2>Third-Party Links</h2>
        <p>Our website may contain links to third-party websites or services. We are not responsible for the privacy practices of those third parties.</p>
        <h2>Children's Privacy</h2>
        <p>TRXSHOP is not intended for children under the age required by applicable law. We do not knowingly collect personal information from children.</p>
        <h2>Changes to This Policy</h2>
        <p>We may update this Privacy Policy from time to time. Changes will become effective when posted on this page.</p>
        <h2>Contact</h2>
        <p>If you have questions regarding this Privacy Policy, please contact:</p>
        <p>Email: <a href="mailto:support@trxshop.in">support@trxshop.in</a></p>
      </>
    ),
  },
  refund: {
    title: "Refund & Cancellation Policy",
    updated: "June 2026",
    body: (
      <>
        <p>At TRXSHOP, we strive to provide high-quality digital products and services. Due to the nature of digital goods, all refund requests are reviewed individually and subject to the terms below.</p>
        <h2>General Policy</h2>
        <p>Most products sold through TRXSHOP are delivered digitally. Once a digital product has been delivered, refunds may not be available except in situations outlined in this policy.</p>
        <h2>Eligible Refund Situations</h2>
        <p>A refund, replacement, or store credit may be considered if:</p>
        <ul>
          <li>The product was not delivered.</li>
          <li>The delivered product is materially different from its description.</li>
          <li>A duplicate payment was made.</li>
          <li>A technical issue on our side prevents delivery.</li>
          <li>We are unable to provide the purchased product.</li>
        </ul>
        <h2>Shared Accounts and Access-Based Products</h2>
        <p>Certain products sold through TRXSHOP provide access to shared accounts, subscriptions, software, digital services, streaming services, or third-party platforms.</p>
        <p>By purchasing these products, you acknowledge and agree that:</p>
        <ul>
          <li>Access is provided according to the product description at the time of purchase.</li>
          <li>Access methods, features, and availability may change due to actions taken by the third-party service provider.</li>
          <li>TRXSHOP does not own, operate, or control third-party services.</li>
          <li>Service interruptions, platform updates, account restrictions, policy changes, regional limitations, or actions taken by the third-party provider are outside of TRXSHOP's control.</li>
        </ul>
        <h2>Non-Refundable Situations</h2>
        <p>Refunds will generally not be issued for:</p>
        <ul>
          <li>Change of mind.</li>
          <li>Accidental purchases.</li>
          <li>Failure to read the product description.</li>
          <li>Compatibility issues not caused by TRXSHOP.</li>
          <li>Regional restrictions.</li>
          <li>Temporary interruptions of service.</li>
          <li>Issues caused by third-party providers.</li>
          <li>Failure to follow provided instructions.</li>
          <li>Violations of third-party platform policies.</li>
          <li>Dissatisfaction with features that were accurately described before purchase.</li>
          <li>Products that have already been successfully delivered.</li>
        </ul>
        <h2>Fraud Prevention</h2>
        <p>TRXSHOP reserves the right to deny refund requests where fraud, abuse, suspicious activity, unauthorized payment activity, or attempts to exploit the refund system are detected.</p>
        <h2>Chargebacks and Payment Disputes</h2>
        <p>Customers agree to contact TRXSHOP support before initiating chargebacks or payment disputes.</p>
        <p>We will make reasonable efforts to investigate and resolve legitimate issues.</p>
        <h2>Refund Processing</h2>
        <p>Approved refunds may be issued through the original payment method, replacement product, or store credit at TRXSHOP's discretion.</p>
        <p>Processing times may vary depending on the payment provider.</p>
        <h2>Policy Updates</h2>
        <p>TRXSHOP reserves the right to modify this Refund Policy at any time without prior notice.</p>
        <h2>Contact</h2>
        <p>For refund requests or questions:</p>
        <p>Email: <a href="mailto:support@trxshop.in">support@trxshop.in</a></p>
      </>
    ),
  },
  shipping: {
    title: "Shipping & Delivery Policy",
    updated: "June 2026",
    body: (
      <>
        <p>TRXSHOP sells <strong>digital products only</strong>. Nothing is shipped physically — every order is delivered electronically to your TRXSHOP account and the email address linked to it.</p>
        <h2>1. Delivery time</h2>
        <ul>
          <li><strong>Most orders:</strong> instant. The key appears in your account within seconds of payment.</li>
          <li><strong>Manual review:</strong> first-time buyers and large orders may be held briefly for fraud prevention. Maximum hold time is 24 hours.</li>
          <li><strong>Pre-orders:</strong> the key is delivered on the game's official release date.</li>
        </ul>
        <h2>2. Where to find your key</h2>
        <p>After payment, your key is available in two places:</p>
        <ul>
          <li>Your <strong>Account → Orders</strong> page on this site.</li>
          <li>A confirmation email sent to the address registered to your account.</li>
        </ul>
        <p>If the email does not arrive within 10 minutes, please check your spam folder before contacting support.</p>
        <h2>3. Delivery charges</h2>
        <p>There are no shipping or delivery charges. The price you see at checkout is the final price.</p>
        <h2>4. Where we deliver</h2>
        <p>We deliver worldwide, anywhere a digital key can be redeemed. Region locks for individual games are listed on each product page — please confirm region compatibility before purchasing.</p>
        <h2>5. Failed deliveries</h2>
        <p>If 24 hours have passed without delivery, email <a href="mailto:support@trxshop.in">support@trxshop.in</a> with your order ID. We will either deliver the key or issue a full refund.</p>
      </>
    ),
  },
};

export const LEGAL_HREF_TO_KEY: Record<string, LegalKey> = {
  "/terms": "terms",
  "/privacy": "privacy",
  "/refund": "refund",
  "/shipping": "shipping",
};
