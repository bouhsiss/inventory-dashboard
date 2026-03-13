import { Page, Card, Text, BlockStack, Button } from "@shopify/polaris";
import { claimStock, getInventory } from "../models/inventory.server";
import type { Route } from "./+types/dashboard";
import { Await, useFetcher, useLoaderData } from "react-router";
import { Suspense } from "react";

export async function loader({ request }: Route.LoaderArgs) {
    return {
        inventory: getInventory()
    }
}


export async function action({ request }: Route.ActionArgs) {
    const formData = await request.formData();

    const itemId = formData.get("itemId");

    if (typeof itemId !== "string" || !itemId) {
        return {
            ok: false,
            error: "Missing item id."
        }
    }

    try {
        await claimStock(itemId);

        return {
            ok: true,
        }
    } catch (error) {
        return {
            ok: false,
            error: error instanceof Error ? error.message : "Failed to claim item.",
        }
    }
}

type InventoryItem = {
    id: string;
    name: string;
    stock: number;
}

type ClaimActionData =
    | { ok: true }
    | { ok: false; error: string };

export default function DashboardPage() {
    const { inventory } = useLoaderData<typeof loader>();

    return (
        <Page title="Inventory Dashboard">
            <BlockStack gap="500">
                {/* -------- static shell -------- */}
                <Card>
                    <BlockStack gap="300">
                        <Text as="h2" variant="headingMd">
                            Inventory Overview
                        </Text>
                        <Text as="p" variant="bodyMd">
                            this dashboard  displays inventory items and lets users claim stock.
                        </Text>
                    </BlockStack>
                </Card>

                {/* -------- Inventory Section (dynamic) -------- */}
                <Card>
                    <BlockStack gap="300">
                        <Text as="h3" variant="headingSm">
                            Inventory List
                        </Text>
                        <Suspense fallback={<InventoryGridSkeleton />}>
                            <Await resolve={inventory}>
                                {(items: InventoryItem[]) => (
                                    <InventoryList items={items} />
                                )}
                            </Await>
                        </Suspense>
                    </BlockStack>
                </Card>
            </BlockStack>
        </Page>
    )
}

/* -------- Loading State -------- */
function InventoryGridSkeleton() {
    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "16px",
            }}
        >
            {Array.from({ length: 4 }).map((_, index) => (
                <Card key={index}>
                    <BlockStack gap="100">
                        <div
                            style={{
                                height: "20px",
                                width: "70%",
                                borderRadius: "6px",
                                background: "var(--p-color-bg-fill-tertiary)",
                            }}
                        />
                        <div
                            style={{
                                height: "16px",
                                width: "40%",
                                borderRadius: "6px",
                                background: "var(--p-color-bg-fill-tertiary)",
                            }}
                        />
                    </BlockStack>
                </Card>
            ))}

        </div>
    )
}

/* -------- Inventory List -------- */
function InventoryList({ items }: { items: InventoryItem[] }) {
    if (!items.length) {
        return (
            <Text as="p" variant="bodyMd" tone="subdued">
                No inventory items found.
            </Text>
        )
    }

    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "16px",
            }}
        >
            {items.map((item) => (
                <InventoryItemCard key={item.id} item={item} />
            ))}
        </div>
    );
}

/* -------- Inventory Item Card -------- */
function InventoryItemCard({ item }: { item: InventoryItem }) {
    const fetcher = useFetcher<ClaimActionData>();

    const isThisItemSubmitting =
        fetcher.state !== "idle" &&
        fetcher.formData?.get("itemId") === item.id;

    const optimisticStock =
        isThisItemSubmitting && item.stock > 0 ? item.stock - 1 : item.stock;

    const actionError =
        fetcher.data && !fetcher.data.ok ? fetcher.data.error : null;

    return (
        <Card>
            <BlockStack gap="300">
                <BlockStack gap="100">
                    <Text as="h4" variant="headingSm">
                        {item.name}
                    </Text>
                    <Text as="p" variant="bodyMd" tone="subdued">
                        Stock: {optimisticStock}
                    </Text>
                </BlockStack>
                {actionError ? (
                    <Text as="p" variant="bodySm" tone="critical">
                        {actionError}
                    </Text>
                ) : null}
                <fetcher.Form method="post">
                    <input type="hidden" name="itemId" value={item.id} />
                    <Button submit variant="primary" loading={isThisItemSubmitting} disabled={isThisItemSubmitting}>
                        Claim One
                    </Button>
                </fetcher.Form>
            </BlockStack>
        </Card>
    )
}