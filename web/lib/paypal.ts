const PACKAGE_DETAILS = {
  starter: {
    credits: 100,
    price: "1.99",
    name: "Graphref Starter",
    description: "Graphref Starter - 100 Credits",
  },
  basic: {
    credits: 500,
    price: "8.99",
    name: "Graphref Basic",
    description: "Graphref Basic - 500 Credits",
  },
  pro: {
    credits: 1000,
    price: "15.99",
    name: "Graphref Pro",
    description: "Graphref Pro - 1,000 Credits",
  },
} as const;

type PackageKey = keyof typeof PACKAGE_DETAILS;
type PayPalLink = {
  rel?: string;
  href?: string;
};

class PayPalConfigError extends Error {}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new PayPalConfigError(`Missing ${name}`);
  }
  return value;
}

function getApiBase(): string {
  return (process.env.PAYPAL_API_BASE?.trim() || "https://api-m.sandbox.paypal.com").replace(/\/+$/, "");
}

export function getPackageDetails(packageKey: string) {
  const details = PACKAGE_DETAILS[packageKey as PackageKey];
  if (!details) {
    throw new Error(`Unknown package: ${packageKey}`);
  }
  return details;
}

async function getAccessToken(): Promise<string> {
  const clientId = requireEnv("PAYPAL_CLIENT_ID");
  const secret = requireEnv("PAYPAL_SECRET");
  const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");

  const response = await fetch(`${getApiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: "application/json",
      "Accept-Language": "en_US",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
    cache: "no-store",
  });

  const raw = await response.text();
  const data = raw ? JSON.parse(raw) : {};

  if (!response.ok) {
    throw new Error(`PayPal HTTP ${response.status}: ${raw}`);
  }

  const token = String(data.access_token || "").trim();
  if (!token) {
    throw new Error("Missing PayPal access token");
  }

  return token;
}

export async function createCheckoutUrl(chatId: string, packageKey: string) {
  const details = getPackageDetails(packageKey);
  const returnUrl = requireEnv("PAYPAL_RETURN_URL");
  const cancelUrl = requireEnv("PAYPAL_CANCEL_URL");
  const currencyCode = process.env.PAYPAL_CURRENCY?.trim() || "USD";
  const brandName = process.env.PAYPAL_BRAND_NAME?.trim() || "Graphref";
  const accessToken = await getAccessToken();

  const response = await fetch(`${getApiBase()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: packageKey,
          custom_id: `${chatId}:${packageKey}`,
          description: details.description,
          amount: {
            currency_code: currencyCode,
            value: details.price,
          },
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            brand_name: brandName,
            shipping_preference: "NO_SHIPPING",
            user_action: "PAY_NOW",
            return_url: returnUrl,
            cancel_url: cancelUrl,
          },
        },
      },
    }),
    cache: "no-store",
  });

  const raw = await response.text();
  const data = raw ? JSON.parse(raw) : {};

  if (!response.ok) {
    throw new Error(`PayPal HTTP ${response.status}: ${raw}`);
  }

  const links: PayPalLink[] = Array.isArray(data.links) ? data.links : [];
  const approval = links.find((link: PayPalLink) => link.rel === "payer-action" || link.rel === "approve");
  const checkoutUrl = typeof approval?.href === "string" ? approval.href : "";

  if (!checkoutUrl) {
    throw new Error("Missing PayPal approval URL");
  }

  return {
    checkoutUrl,
    credits: details.credits,
    packageKey,
    name: details.name,
    price: details.price,
  };
}

export { PayPalConfigError };
