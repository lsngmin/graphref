"use server";

import { redirect } from "next/navigation";

export async function createCheckout(formData: FormData) {
  const variantId = formData.get("variantId")?.toString();
  const plan = formData.get("plan")?.toString() ?? "plan";
  const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
  const storeId = process.env.LEMON_SQUEEZY_STORE_ID;
  const testMode = process.env.LEMON_SQUEEZY_TEST_MODE === "true";

  if (!apiKey || !storeId || !variantId) {
    throw new Error("Missing Lemon Squeezy configuration.");
  }

  const payload = {
    data: {
      type: "checkouts",
      attributes: {
        checkout_data: {
          custom: {
            plan,
          },
        },
        checkout_options: {
          embed: false,
        },
        product_options: {
          enabled_variants: [Number(variantId)],
        },
        test_mode: testMode,
      },
      relationships: {
        store: {
          data: {
            type: "stores",
            id: storeId,
          },
        },
        variant: {
          data: {
            type: "variants",
            id: variantId,
          },
        },
      },
    },
  };

  const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
    method: "POST",
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Failed to create checkout");
  }

  const data = await response.json();
  const checkoutUrl = data?.data?.attributes?.url as string | undefined;

  if (!checkoutUrl) {
    throw new Error("Missing checkout url");
  }

  redirect(checkoutUrl);
}
